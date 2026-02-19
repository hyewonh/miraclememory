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


export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const { allProgress, loading: progressLoading } = useAllProgress();
    const router = useRouter();
    const { language } = useLanguage();

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    if (authLoading || profileLoading || progressLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800"></div>
            </div>
        );
    }

    if (!user) return null;

    // Filter series to show only those with progress OR subscribed
    // Since "subscription" isn't fully defined, we'll show any series that has at least 1 verse completed
    // AND we'll also show recommended/popular series if none are started?
    // Let's show:
    // 1. "My Series" (Series with > 0 progress)
    // 2. "All Series" (The rest, maybe? Or just fetch all and let user filter?)
    // User request: "Check what series I am subscribed to/applying for"

    // Let's interpret "Subscribed" as any series in the progress map, even if progress is 0 
    // (though our hook only returns docs that exist, which implies some interaction).
    // Actually, Firestore docs might not exist if user never touched it.

    // We will iterate through INITIAL_SERIES and check if we have progress for it.
    const mySeries = INITIAL_SERIES.filter(series => {
        const prog = allProgress[series.id];
        // Check if there's any progress data. 
        // If we strictly want "active", maybe >0 completed verses?
        // But user might have "started" a series without finishing verse 1.
        // For now, let's include anything present in allProgress map with at least one verse completion 
        // OR simply display all series but highlight the active ones?
        // The prompt asks to "check what series I am subscribed to". 
        // Let's show active series first.

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
                    <div className="w-20"></div> {/* Spacer for centering */}
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

                        {/* My Series (Row 2) */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-stone-900 pl-2 border-l-4 border-amber-400">
                                My Series
                            </h2>

                            {mySeries.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {mySeries.map(series => (
                                        <SeriesProgressCard
                                            key={series.id}
                                            series={series}
                                            progress={allProgress[series.id]}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-8 text-center border border-stone-100 border-dashed">
                                    <p className="text-stone-500 mb-4">You haven't started any series yet.</p>
                                    <button
                                        onClick={() => router.push("/#series")}
                                        className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
                                    >
                                        Browse Series
                                    </button>
                                </div>
                            )}
                        </div>


                    </div>
                </div>

                {/* All Series Link/Section? Maybe just keep it focused on User's stuff for now. */}

            </main>
        </div>
    );
}
