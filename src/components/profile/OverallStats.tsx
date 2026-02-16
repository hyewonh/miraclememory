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

    // Determine Tier and Diamonds
    let tier = "Bronze";
    let tierColor = "text-stone-500";
    let diamonds = 0;

    if (seriesCompleted >= 3) {
        tier = "Diamond";
        tierColor = "text-cyan-500";
        diamonds = 3;
    } else if (seriesCompleted >= 1) {
        tier = "Gold";
        tierColor = "text-amber-500";
        diamonds = 1;
    } else if (totalVerses >= 30) {
        tier = "Silver";
        tierColor = "text-stone-400";
    }

    const streak = profile?.streak || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rank / Tier Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className={`text-4xl mb-2 ${tierColor}`}>
                    {/* Icon based on Tier */}
                    {tier === "Diamond" && "💎"}
                    {tier === "Gold" && "🥇"}
                    {tier === "Silver" && "🥈"}
                    {tier === "Bronze" && "🥉"}
                </div>
                <div className={`text-xl font-serif font-bold ${tierColor} mb-1`}>
                    {tier} Rank
                </div>
                {diamonds > 0 && (
                    <div className="flex gap-1 text-sm text-cyan-500 font-bold items-center mt-1 bg-cyan-50 px-3 py-1 rounded-full">
                        <span>💎</span> {diamonds}
                    </div>
                )}
                <div className="text-[10px] uppercase tracking-widest text-stone-400 mt-2">
                    Current Status
                </div>
            </div>

            {/* Streak */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center group relative" title="Consecutive days of practice">
                <div className="text-4xl font-serif font-bold text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                    🔥 {streak}
                </div>
                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                    Day Streak
                </div>
                <div className="text-xs text-stone-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2">
                    Consecutive Days
                </div>
            </div>

            {/* Crown Level (Series Completed) */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center group">
                <div className="text-4xl font-serif font-bold text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                    👑 {seriesCompleted}
                </div>
                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                    Crown Level
                </div>
            </div>

            {/* Total Verses */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-serif font-bold text-stone-900 mb-2">
                    {totalVerses}
                </div>
                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                    Verses Memorized
                </div>
            </div>
        </div>
    );
}
