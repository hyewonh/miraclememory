import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { AllSeriesProgress } from "@/hooks/useAllProgress";
import { UserProfile } from "@/types";

interface OverallStatsProps {
    allProgress: AllSeriesProgress;
    profile: UserProfile | null;
}

export function OverallStats({ allProgress, profile }: OverallStatsProps) {
    const { language } = useLanguage();
    const [showRankInfo, setShowRankInfo] = useState(false);

    // Calculate totals
    let totalVerses = 0;
    let seriesCompleted = 0;

    Object.values(allProgress).forEach(prog => {
        const count = (prog.completedVerses.en?.length || 0) +
            (prog.completedVerses.ko?.length || 0) +
            (prog.completedVerses.zh?.length || 0) +
            (prog.completedVerses.es?.length || 0);

        totalVerses += count;

        if (prog.isCompleted) {
            seriesCompleted++;
        }
    });

    // Determine Tier and Progress
    let tier = "Bronze";
    let tierColor = "text-amber-700"; // Bronze color adjusted
    let nextTier = "Silver";
    let progress = 0;
    let progressMessage = "";

    // Logic:
    // Bronze: < 30 verses. Goal: 30 verses.
    // Silver: >= 30 verses. Goal: 1 series.
    // Gold: >= 1 series. Goal: 3 series.
    // Diamond: >= 3 series. Max.

    if (seriesCompleted >= 3) {
        tier = "Diamond";
        tierColor = "text-cyan-500";
        nextTier = "Max Rank";
        progress = 100;
        progressMessage = "Legendary status achieved!";
    } else if (seriesCompleted >= 1) {
        tier = "Gold";
        tierColor = "text-amber-500";
        nextTier = "Diamond";
        // Progress from 1 series (33%) to 3 series (100%)? 
        // Let's just do raw progress to next goal? 
        // 1 series done. Need 3. so 1/3? 2/3?
        // Let's keep it simple: "Series Completed: X/3"
        progress = (seriesCompleted / 3) * 100;
        const remaining = 3 - seriesCompleted;
        progressMessage = `${remaining} more series to Diamond`;
    } else if (totalVerses >= 30) {
        tier = "Silver";
        tierColor = "text-stone-400";
        nextTier = "Gold";
        // Goal is 1 series. 
        // Since we don't track % of series completion easily here (it varies), 
        // let's just say "Complete 1 series". 
        // Progress bar can show 0% or maybe 50% to encourage? 
        // Let's show 10% to show they started? 
        // Actually, we can check if they have any active series nearing completion? Too complex.
        progress = 5; // Just a sliver to show start
        progressMessage = "Complete 1 series to Gold";
    } else {
        // Bronze
        tier = "Bronze";
        tierColor = "text-amber-700";
        nextTier = "Silver";
        // Goal: 30 verses
        progress = (totalVerses / 30) * 100;
        const remaining = 30 - totalVerses;
        progressMessage = `${remaining} verse${remaining !== 1 ? 's' : ''} to Silver`;
    }

    const streak = profile?.streak || 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Rank Info Modal/Popup */}
            {showRankInfo && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowRankInfo(false)}></div>
                    <div className="absolute top-0 left-0 lg:left-0 z-50 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 p-4 animate-in fade-in zoom-in-95 duration-100 text-left">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-stone-900">Rank System</h4>
                            <button onClick={() => setShowRankInfo(false)} className="text-stone-400 hover:text-stone-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🥉</span>
                                <div>
                                    <div className="font-bold text-amber-700">Bronze (Seeker)</div>
                                    <div className="text-xs text-stone-500">Start your journey</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🥈</span>
                                <div>
                                    <div className="font-bold text-stone-400">Silver (Disciple)</div>
                                    <div className="text-xs text-stone-500">Memorize 30+ Verses</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🥇</span>
                                <div>
                                    <div className="font-bold text-amber-500">Gold (Worker)</div>
                                    <div className="text-xs text-stone-500">Complete 1 Series</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">💎</span>
                                <div>
                                    <div className="font-bold text-cyan-500">Diamond (Warrior)</div>
                                    <div className="text-xs text-stone-500">Complete 3 Series</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Rank / Tier Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-visible group h-full">
                <button
                    onClick={() => setShowRankInfo(!showRankInfo)}
                    className="absolute top-2 right-2 text-stone-300 hover:text-stone-500 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>

                <div className={`text-4xl mb-2 ${tierColor}`}>
                    {tier === "Diamond" && "💎"}
                    {tier === "Gold" && "🥇"}
                    {tier === "Silver" && "🥈"}
                    {tier === "Bronze" && "🥉"}
                </div>
                <div className={`text-lg font-serif font-bold ${tierColor} mb-3`}>
                    {tier} Rank
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-100 rounded-full h-2 mb-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${tier === 'Diamond' ? 'bg-cyan-400' : tier === 'Gold' ? 'bg-amber-400' : tier === 'Silver' ? 'bg-stone-300' : 'bg-amber-600'}`}
                        style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
                    ></div>
                </div>
                <div className="text-[10px] uppercase tracking-wide text-stone-500 font-bold">
                    {progressMessage}
                </div>
            </div>

            {/* Streak */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center group h-full" title="Consecutive days of practice">
                <div className="text-4xl font-serif font-bold text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                    🔥 {streak}
                </div>
                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                    Day Streak
                </div>
            </div>

            {/* Crown Level (Renamed to Crowns Earned) */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center group h-full">
                <div className="text-4xl font-serif font-bold text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                    👑 {seriesCompleted}
                </div>
                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">
                    Crowns Earned
                </div>
            </div>

            {/* Total Verses */}
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center h-full">
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
