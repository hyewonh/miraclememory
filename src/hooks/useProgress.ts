"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export interface SeriesProgress {
    // Language specific arrays
    completedVerses: {
        en?: string[];
        ko?: string[];
        zh?: string[];
        es?: string[];
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
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

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
                        es: completedVerses.es || []
                    },
                    isCompleted: data.isCompleted || false,
                    lastUpdated: data.lastUpdated || Date.now()
                });
            } else {
                setProgress({
                    completedVerses: { en: [], ko: [], zh: [], es: [] },
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

        const currentLangVerses = progress.completedVerses[language] || [];
        const isMemorized = currentLangVerses.includes(verseId);

        let newLangVerses: string[];

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
            const docRef = doc(db, "users", user.uid, "series_progress", seriesId);
            await setDoc(docRef, newProgress, { merge: true });
        } catch (error) {
            console.error("Error updating progress:", error);
            // Revert on error would go here
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
        getCompletedCount: (lang: 'en' | 'ko' | 'zh' | 'es' = language) => {
            return progress?.completedVerses[lang]?.length || 0;
        }
    };
}
