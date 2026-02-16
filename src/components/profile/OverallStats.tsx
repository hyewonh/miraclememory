"use client";

import { useLanguage } from "@/context/LanguageContext";
import { AllSeriesProgress } from "@/hooks/useAllProgress";
import { UserProfile } from "@/types";

interface OverallStatsProps {
    allProgress: AllSeriesProgress;
    profile: UserProfile | null;
}

export function OverallStats({ allProgress, profile }: OverallStatsProps) {
    const { language } = useLanguage();

    // Calculate totals
    let totalVerses = 0;
    let seriesCompleted = 0;

    Object.values(allProgress).forEach(prog => {
        // Count verses for CURRENT language or ALL languages? 
        // Typically users stick to one language, but let's count current language for relevance
        // OR count unique verses across languages? Let's just sum current language for now as a simple metric.
        // Actually, let's sum ALL verses for a "Total Memorized" count.
        const count = (prog.completedVerses.en?.length || 0) +
            (prog.completedVerses.ko?.length || 0) +
            (prog.completedVerses.zh?.length || 0) +
            (prog.completedVerses.es?.length || 0);

        totalVerses += count;

        if (prog.isCompleted) {
            seriesCompleted++;
        }
    });

    const streak = profile?.streak || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Verses */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-serif font-bold text-stone-900 mb-2">
                    {totalVerses}
                </div>
                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                    Verses Memorized
                </div>
            </div>

            {/* Streak */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-serif font-bold text-emerald-600 mb-2">
                    {streak}
                </div>
                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                    Day Streak
                </div>
            </div>

            {/* Series Completed */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-serif font-bold text-amber-500 mb-2">
                    {seriesCompleted}
                </div>
                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                    Series Completed
                </div>
            </div>
        </div>
    );
}
