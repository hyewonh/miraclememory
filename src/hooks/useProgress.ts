"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, getDoc, Timestamp } from "firebase/firestore";

export interface SeriesProgress {
    // Language specific arrays
    completedVerses: {
        en?: string[];
        ko?: string[];
        zh?: string[];
        es?: string[];
        de?: string[];
        fr?: string[];
    };
    isCompleted: boolean;
    lastUpdated: number;
}

export function useProgress(seriesId: string) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const [progress, setProgress] = useState<SeriesProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !seriesId) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, "users", user.uid, "series_progress", seriesId);

        // Real-time listener
        console.log(`📡 Setting up progress listener for user: ${user.uid}, series: ${seriesId}`);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            console.log(`📥 Progress snapshot received for ${seriesId}. Exists: ${docSnap.exists()}`);
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("📄 Snapshot Data:", data);

                // Handle legacy data structure migration
                let completedVerses = data.completedVerses || {};

                // If we find the old 'completedVerseIds' array, migrate it to 'en' (default)
                if (data.completedVerseIds && Array.isArray(data.completedVerseIds) && !data.completedVerses) {
                    completedVerses = {
                        en: data.completedVerseIds
                    };
                }

                setProgress({
                    completedVerses: {
                        en: completedVerses.en || [],
                        ko: completedVerses.ko || [],
                        zh: completedVerses.zh || [],
                        es: completedVerses.es || [],
                        de: completedVerses.de || [],
                        fr: completedVerses.fr || []
                    },
                    isCompleted: data.isCompleted || false,
                    lastUpdated: data.lastUpdated || Date.now()
                });
            } else {
                console.log("✨ No progress doc found, initializing empty.");
                setProgress({
                    completedVerses: { en: [], ko: [], zh: [], es: [], de: [], fr: [] },
                    isCompleted: false,
                    lastUpdated: Date.now()
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, seriesId]);

    const toggleVerseMemorized = async (verseId: string) => {
        if (!user || !progress) return;

        console.log(`✏️ Toggling verse ${verseId} for language ${language}`);
        const currentLangVerses = progress.completedVerses[language] || [];
        const isMemorized = currentLangVerses.includes(verseId);

        let newLangVerses: string[];

        // Calculate expected new state
        if (isMemorized) {
            newLangVerses = currentLangVerses.filter(id => id !== verseId);
        } else {
            newLangVerses = [...currentLangVerses, verseId];
        }

        const newProgress: SeriesProgress = {
            ...progress,
            completedVerses: {
                ...progress.completedVerses,
                [language]: newLangVerses
            },
            lastUpdated: Date.now()
        };

        // Optimistic update
        setProgress(newProgress);

        try {
            const seriesRef = doc(db, "users", user.uid, "series_progress", seriesId);
            const userRef = doc(db, "users", user.uid);

            console.log(`💾 Saving progress to Firestore key: ${seriesId}`);

            // Allow concurrent writes, but we can just use independent awaits for simplicity here 
            // since they are different parts of the system.
            await setDoc(seriesRef, newProgress, { merge: true });
            console.log("✅ Progress saved successfully!");

            // Update Streak logic ONLY if we are ADDING a verse (memorizing)
            if (!isMemorized) {
                try {
                    // We need to fetch the user profile to check the last date
                    // But we can't use the hook's profile state here easily without prop drilling.
                    // We'll read the doc directly. Ideally this should be a Transaction or Cloud Function.
                    // For MVP, client-side read-modify-write is acceptable but risky for race conditions.
                    // Let's assume low concurrency for a single user.

                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = userSnap.data();

                        // Safe date conversion
                        let lastDate: Date | null = null;
                        if (userData.lastPracticeDate) {
                            if (userData.lastPracticeDate instanceof Timestamp) {
                                lastDate = userData.lastPracticeDate.toDate();
                            } else if (userData.lastPracticeDate instanceof Date) {
                                lastDate = userData.lastPracticeDate;
                            } else if (typeof userData.lastPracticeDate === 'string') {
                                lastDate = new Date(userData.lastPracticeDate);
                            }
                        }

                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Normalize to midnight

                        let newStreak = userData.streak || 0;
                        let shouldUpdate = false;

                        if (!lastDate) {
                            // First time ever
                            newStreak = 1;
                            shouldUpdate = true;
                        } else {
                            const last = new Date(lastDate);
                            last.setHours(0, 0, 0, 0);

                            const diffTime = Math.abs(today.getTime() - last.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays === 1) {
                                // Consecutive day
                                newStreak += 1;
                                shouldUpdate = true;
                            } else if (diffDays > 1) {
                                // Broken streak
                                newStreak = 1;
                                shouldUpdate = true;
                            } else {
                                // Same day (diffDays === 0)
                                // No streak change, but we might verify streak is at least 1?
                                if (newStreak === 0) {
                                    newStreak = 1;
                                    shouldUpdate = true;
                                }
                            }
                        }

                        if (shouldUpdate) {
                            await setDoc(userRef, {
                                streak: newStreak,
                                lastPracticeDate: new Date() // Store as full date-time or just date? 
                                // Providing a Date object to Firestore SDK converts it to Timestamp automatically.
                            }, { merge: true });
                            console.log(`🔥 Streak updated to ${newStreak}`);
                        }
                    }
                } catch (streakErr) {
                    console.error("Error updating streak:", streakErr);
                }
            }

        } catch (error) {
            console.error("❌ Error updating progress:", error);
            // Revert optimistic update if needed (not implemented for simplicity)
        }
    };

    return {
        progress,
        loading,
        toggleVerseMemorized,
        isMemorized: (verseId: string) => {
            return progress?.completedVerses[language]?.includes(verseId) || false;
        },
        // Helper to check completion for *any* language or specific language
        getCompletedCount: (lang: 'en' | 'ko' | 'zh' | 'es' | 'de' | 'fr' = language) => {
            return progress?.completedVerses[lang]?.length || 0;
        }
    };
}
