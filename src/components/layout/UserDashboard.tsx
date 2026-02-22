"use client";

import { useAllProgress } from "@/hooks/useAllProgress";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/context/LanguageContext";
import { INITIAL_SERIES, VERSES } from "@/data/seedData";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export function UserDashboard() {
    const { allProgress, loading } = useAllProgress();
    const { profile } = useProfile();
    const { language } = useLanguage();
    const router = useRouter();

    const stats = useMemo(() => {
        let totalVerses = 0;
        let lastUpdated = 0;
        let lastSeriesId = "";

        Object.entries(allProgress).forEach(([seriesId, prog]) => {
            const count = prog.completedVerses[language]?.length || 0;
            totalVerses += count;

            if (prog.lastUpdated > lastUpdated) {
                lastUpdated = prog.lastUpdated;
                lastSeriesId = seriesId;
            }
        });

        const lastSeries = lastSeriesId
            ? INITIAL_SERIES.find(s => s.id === lastSeriesId)
            : null;

        let resumeVerseIndex = 0;
        if (lastSeries && allProgress[lastSeriesId]) {
            const verses = VERSES.filter(v => v.seriesId === lastSeriesId);
            const completedIds = allProgress[lastSeriesId].completedVerses[language] || [];
            const firstUnmemorized = verses.findIndex(v => !completedIds.includes(v.id));
            resumeVerseIndex = firstUnmemorized >= 0 ? firstUnmemorized : verses.length - 1;
        }

        return {
            totalVerses,
            streak: profile?.streak || 0,
            lastSeries,
            lastSeriesId,
            resumeVerseIndex,
        };
    }, [allProgress, language, profile]);

    if (loading) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-10">
            <div className="bg-stone-100 border border-stone-200 rounded-3xl p-5 md:p-7">

                {/* ── Mobile: centered column / Desktop: row ── */}
                <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-5">

                    {/* Stats — centered on mobile, left on desktop */}
                    <div className="flex items-center justify-center gap-3 md:gap-4">
                        {/* Streak */}
                        <div className="flex flex-col items-center bg-white border border-stone-200 rounded-2xl px-5 py-3 min-w-[86px] shadow-sm">
                            <div className="text-2xl font-bold text-amber-500">🔥 {stats.streak}</div>
                            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mt-1">Day Streak</div>
                        </div>
                        {/* Verses */}
                        <div className="flex flex-col items-center bg-white border border-stone-200 rounded-2xl px-5 py-3 min-w-[86px] shadow-sm">
                            <div className="text-2xl font-bold text-emerald-500">{stats.totalVerses}</div>
                            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mt-1">Verses</div>
                        </div>
                    </div>

                    {/* Divider on mobile */}
                    <div className="w-full h-px bg-stone-200 md:hidden" />

                    {/* Resume CTA — centered on mobile */}
                    <div className="flex-1 min-w-0 flex flex-col items-center md:items-start">
                        {stats.lastSeries ? (
                            <>
                                <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-1">
                                    Continue where you left off
                                </p>
                                <h3 className="text-base md:text-lg font-bold text-stone-800 mb-3 truncate max-w-full">
                                    {stats.lastSeries.title[language]}
                                </h3>
                                <button
                                    onClick={() => router.push(`/series/${stats.lastSeriesId}`)}
                                    className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white font-bold px-6 py-2.5 rounded-full transition-all hover:scale-105 shadow-md text-sm"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Resume Learning
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-stone-500 text-sm mb-3">
                                    Start memorizing scripture — one verse at a time.
                                </p>
                                <button
                                    onClick={() => {
                                        document.getElementById("series")?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white font-bold px-6 py-2.5 rounded-full transition-all hover:scale-105 shadow-md text-sm"
                                >
                                    Browse Series
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
