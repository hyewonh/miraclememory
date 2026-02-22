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

    const hasActivity = stats.totalVerses > 0 || stats.streak > 0;

    return (
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 mt-4">
            {/* Welcome dashboard */}
            <div className="bg-stone-100 border border-stone-200 rounded-3xl p-5 md:p-6 overflow-hidden relative">
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
                    {/* Stats row */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Streak */}
                        <div className="flex flex-col items-center bg-white border border-stone-200 rounded-2xl px-5 py-3 min-w-[80px] shadow-sm">
                            <div className="text-3xl font-bold text-amber-500">🔥 {stats.streak}</div>
                            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mt-1">Day Streak</div>
                        </div>

                        {/* Total verses */}
                        <div className="flex flex-col items-center bg-white border border-stone-200 rounded-2xl px-5 py-3 min-w-[80px] shadow-sm">
                            <div className="text-3xl font-bold text-emerald-500">{stats.totalVerses}</div>
                            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mt-1">Verses</div>
                        </div>
                    </div>

                    {/* Resume CTA */}
                    <div className="flex-1 min-w-0">
                        {stats.lastSeries ? (
                            <div>
                                <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-1">Continue where you left off</p>
                                <h3 className="text-lg font-bold text-stone-800 mb-3 truncate">
                                    {stats.lastSeries.title[language]}
                                </h3>
                                <button
                                    onClick={() => router.push(`/series/${stats.lastSeriesId}`)}
                                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105 shadow-md shadow-amber-200 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Resume Learning
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-stone-500 text-sm mb-3">
                                    Start memorizing scripture today — one verse at a time.
                                </p>
                                <button
                                    onClick={() => {
                                        document.getElementById("series")?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105 shadow-md shadow-amber-200 text-sm"
                                >
                                    Browse Series
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Motivational message */}
                    {hasActivity && (
                        <div className="hidden lg:block text-right">
                            <div className="text-4xl mb-1">
                                {stats.streak >= 7 ? "🏆" : stats.streak >= 3 ? "⚡" : "✨"}
                            </div>
                            <p className="text-stone-400 text-xs max-w-[160px] leading-relaxed">
                                {stats.streak >= 7
                                    ? "Incredible streak! Keep it up!"
                                    : stats.streak >= 3
                                        ? "Great momentum! Don't stop now."
                                        : "Every verse brings you closer to God."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
