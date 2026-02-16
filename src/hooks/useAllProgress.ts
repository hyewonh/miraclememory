"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { SeriesProgress } from "./useProgress";

export interface AllSeriesProgress {
    [seriesId: string]: SeriesProgress;
}

export function useAllProgress() {
    const { user } = useAuth();
    const [allProgress, setAllProgress] = useState<AllSeriesProgress>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setAllProgress({});
            setLoading(false);
            return;
        }

        const collectionRef = collection(db, "users", user.uid, "series_progress");
        // No query needed, we want all docs in the subcollection

        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const progressMap: AllSeriesProgress = {};

            snapshot.docs.forEach(doc => {
                const data = doc.data();

                // Handle legacy data structure migration (same as useProgress)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const legacyData = data as any;
                let completedVerses = data.completedVerses || {};

                if (legacyData.completedVerseIds && Array.isArray(legacyData.completedVerseIds) && !data.completedVerses) {
                    completedVerses = {
                        en: legacyData.completedVerseIds
                    };
                }

                progressMap[doc.id] = {
                    completedVerses: {
                        en: completedVerses.en || [],
                        ko: completedVerses.ko || [],
                        zh: completedVerses.zh || [],
                        es: completedVerses.es || []
                    },
                    isCompleted: data.isCompleted || false,
                    lastUpdated: data.lastUpdated || Date.now()
                };
            });

            setAllProgress(progressMap);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching all progress:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { allProgress, loading };
}
