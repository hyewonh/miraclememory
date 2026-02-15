"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, onSnapshot } from "firebase/firestore";
import { SeriesProgress } from "./useProgress";

export interface GlobalProgress {
    totalVersesMemorized: number;
    byLanguage: {
        en: number;
        ko: number;
        zh: number;
        es: number;
    };
    seriesCompletedCount: number;
    loading: boolean;
}

export function useAllProgress() {
    const { user } = useAuth();
    const [stats, setStats] = useState<GlobalProgress>({
        totalVersesMemorized: 0,
        byLanguage: { en: 0, ko: 0, zh: 0, es: 0 },
        seriesCompletedCount: 0,
        loading: true
    });

    useEffect(() => {
        if (!user) {
            setStats(prev => ({ ...prev, loading: false }));
            return;
        }

        const collectionRef = collection(db, "users", user.uid, "series_progress");

        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            let total = 0;
            const byLang = { en: 0, ko: 0, zh: 0, es: 0 };
            let completedSeries = 0;

            snapshot.forEach(doc => {
                const data = doc.data() as SeriesProgress; // This matches the shape from useProgress

                // Handle legacy migration logic same as useProgress
                let completedVerses = data.completedVerses || {};
                if (data.completedVerseIds && Array.isArray(data.completedVerseIds) && !data.completedVerses) {
                    completedVerses = { en: data.completedVerseIds };
                }

                // Aggregate counts
                const enCount = completedVerses.en?.length || 0;
                const koCount = completedVerses.ko?.length || 0;
                const zhCount = completedVerses.zh?.length || 0;
                const esCount = completedVerses.es?.length || 0;

                byLang.en += enCount;
                byLang.ko += koCount;
                byLang.zh += zhCount;
                byLang.es += esCount;

                total += (enCount + koCount + zhCount + esCount);

                if (data.isCompleted) completedSeries++;
            });

            setStats({
                totalVersesMemorized: total,
                byLanguage: byLang,
                seriesCompletedCount: completedSeries,
                loading: false
            });
        });

        return () => unsubscribe();
    }, [user]);

    return stats;
}
