"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { VERSES, INITIAL_SERIES } from "@/data/seedData";
import { Verse, Series } from "@/types";

export interface ReviewItem {
    verse: Verse;
    series: Series;
    completedAt: number; // ms timestamp
    daysSince: number;
    reviewInterval: 1 | 3 | 7; // which review phase
}

const REVIEW_INTERVALS = [1, 3, 7] as const;
const TOLERANCE_HOURS = 12; // show reminder if within ±12h of target

/**
 * Reads verse_completions subcollection (if exists) or falls back to
 * series_progress.lastUpdated approximation to find verses due for review.
 *
 * Firestore structure expected:
 *   users/{uid}/verse_completions/{verseId}  →  { completedAt: number, language: string }
 */
export function useReviewReminder() {
    const { user } = useAuth();
    const { language } = useLanguage();
    const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setReviewItems([]);
            setLoading(false);
            return;
        }

        async function fetchCompletions() {
            try {
                const colRef = collection(db, "users", user!.uid, "verse_completions");
                const snap = await getDocs(colRef);

                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;
                const toleranceMs = TOLERANCE_HOURS * 60 * 60 * 1000;

                const items: ReviewItem[] = [];

                snap.docs.forEach((doc) => {
                    const data = doc.data();
                    const verseId = doc.id;
                    const lang = data.language || "en";
                    if (lang !== language) return; // only current language

                    const completedAt: number =
                        typeof data.completedAt === "number"
                            ? data.completedAt
                            : data.completedAt?.toMillis?.() ?? 0;

                    if (!completedAt) return;

                    const daysSince = (now - completedAt) / dayMs;

                    for (const interval of REVIEW_INTERVALS) {
                        const targetMs = completedAt + interval * dayMs;
                        const diff = Math.abs(now - targetMs);
                        if (diff <= toleranceMs && now >= targetMs) {
                            const verse = VERSES.find((v) => v.id === verseId);
                            const series = verse ? INITIAL_SERIES.find((s) => s.id === verse.seriesId) : null;
                            if (verse && series) {
                                items.push({
                                    verse,
                                    series,
                                    completedAt,
                                    daysSince: Math.floor(daysSince),
                                    reviewInterval: interval,
                                });
                            }
                            break; // only the nearest interval
                        }
                    }
                });

                setReviewItems(items);
            } catch (err) {
                console.error("useReviewReminder error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCompletions();
    }, [user, language]);

    const visibleItems = useMemo(
        () => reviewItems.filter((item) => !dismissed.has(item.verse.id)),
        [reviewItems, dismissed]
    );

    const dismiss = (verseId: string) => {
        setDismissed((prev) => new Set([...prev, verseId]));
    };

    const dismissAll = () => {
        setDismissed(new Set(reviewItems.map((i) => i.verse.id)));
    };

    return { reviewItems: visibleItems, loading, dismiss, dismissAll };
}
