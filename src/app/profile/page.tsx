"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAllProgress } from "@/hooks/useAllProgress";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { OverallStats } from "@/components/profile/OverallStats";
import { SeriesProgressCard } from "@/components/profile/SeriesProgressCard";
import { INITIAL_SERIES } from "@/data/seedData";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UI_TEXT } from "@/data/translations";
import { useLanguage } from "@/context/LanguageContext";
import { SubscriptionManager } from "@/components/profile/SubscriptionManager";
import { useCustomSeries } from "@/hooks/useCustomSeries";
import Link from "next/link";


export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const { allProgress, loading: progressLoading } = useAllProgress();
    const { series: customSeries, loading: customSeriesLoading, deleteSeries } = useCustomSeries();
    const router = useRouter();
    const { language } = useLanguage();

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    if (authLoading || profileLoading || progressLoading || customSeriesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800"></div>
            </div>
        );
    }

    if (!user) return null;

    const mySeries = INITIAL_SERIES.filter(series => {
        const prog = allProgress[series.id];
        if (!prog) return false;
        const totalCompleted = (prog.completedVerses.en?.length || 0) +
            (prog.completedVerses.ko?.length || 0) +
            (prog.completedVerses.zh?.length || 0) +
            (prog.completedVerses.es?.length || 0);
        return totalCompleted > 0;
    });

    return (
        <div className="min-h-screen bg-stone-50 pb-20 font-sans">
            {/* Nav Back */}
            <nav className="bg-white border-b border-stone-100 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push("/")}
                        className="text-stone-500 hover:text-stone-900 font-medium text-sm flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Home
                    </button>
                    <span className="font-bold text-stone-900 tracking-wider uppercase text-sm">My Profile</span>
                    <div className="w-20"></div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Profile & Subscription (3/12 = 25%) */}
                    <div className="lg:col-span-3 space-y-6">
                        <ProfileHeader />
                        {profile && <SubscriptionManager profile={profile} />}
                    </div>

                    {/* Right Column: Stats & Others (9/12 = 75%) */}
                    <div className="lg:col-span-9 space-y-10">
                        {/* Stats (Row 1) */}
                        <OverallStats allProgress={allProgress} profile={profile} />

                        {/* My Series (Row 2) — built-in series with progress */}
                        {mySeries.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-serif font-bold text-stone-900 pl-2 border-l-4 border-amber-400">
                                    My Series
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {mySeries.map(series => (
                                        <SeriesProgressCard
                                            key={series.id}
                                            series={series}
                                            progress={allProgress[series.id]}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Custom Series (Row 3) — user-created via Bible page */}
                        {customSeries.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-serif font-bold text-stone-900 pl-2 border-l-4 border-emerald-400">
                                    내 커스텀 시리즈
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {customSeries.map(cs => (
                                        <div key={cs.id} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-stone-900 truncate">{cs.title}</h3>
                                                    {cs.description && (
                                                        <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{cs.description}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (confirm("이 시리즈를 삭제할까요?")) deleteSeries(cs.id);
                                                    }}
                                                    className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                                                    title="삭제"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full">
                                                    {cs.verses.length}구절
                                                </span>
                                                <span className="text-xs text-stone-400">
                                                    {new Date(cs.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center">
                                    <Link href="/bible" className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-2">
                                        + 새 시리즈 만들기
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Empty state — if no series at all */}
                        {mySeries.length === 0 && customSeries.length === 0 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-serif font-bold text-stone-900 pl-2 border-l-4 border-amber-400">
                                    My Series
                                </h2>
                                <div className="bg-white rounded-2xl p-8 text-center border border-stone-100 border-dashed">
                                    <p className="text-stone-500 mb-4">아직 시작한 시리즈가 없어요.</p>
                                    <div className="flex gap-3 justify-center flex-wrap">
                                        <button
                                            onClick={() => router.push("/#series")}
                                            className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors text-sm"
                                        >
                                            Browse Series
                                        </button>
                                        <Link
                                            href="/bible"
                                            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors text-sm"
                                        >
                                            내 시리즈 만들기
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </main>
        </div>
    );
}
