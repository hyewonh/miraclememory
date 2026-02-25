"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAllProgress } from "@/hooks/useAllProgress";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { OverallStats } from "@/components/profile/OverallStats";
import { SeriesProgressCard } from "@/components/profile/SeriesProgressCard";
import { INITIAL_SERIES } from "@/data/seedData";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SubscriptionManager } from "@/components/profile/SubscriptionManager";
import { useCustomSeries, CustomSeries } from "@/hooks/useCustomSeries";
import Link from "next/link";

function CustomSeriesCard({
    cs,
    onDelete,
    onShare,
    language
}: {
    cs: CustomSeries;
    onDelete: (id: string) => Promise<void>;
    onShare: (cs: CustomSeries) => Promise<void>;
    language: 'ko' | 'en' | 'zh' | 'es' | 'de' | 'fr';
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(cs.shareId ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${cs.shareId}` : null);
    const router = useRouter();

    const handleDelete = async () => {
        setDeleting(true);
        await onDelete(cs.id);
        // component unmounts on success, no need to reset
    };

    const handleShare = async () => {
        setSharing(true);
        try {
            await onShare(cs);
            const url = `${window.location.origin}/shared/${cs.shareId ?? `${cs.id}`}`;
            setShareUrl(url);
            await navigator.clipboard.writeText(url);
            alert(UI_TEXT.profile.linkCopied[language]);
        } finally {
            setSharing(false);
        }
    };

    const copyShareUrl = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        alert(UI_TEXT.profile.linkCopied[language]);
    };

    const handleCardClick = () => {
        router.push(`/custom-series/${cs.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col gap-3 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-900 truncate group-hover:text-emerald-700 transition-colors">{cs.title}</h3>
                    {cs.description && (
                        <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{cs.description}</p>
                    )}
                </div>
                {/* Delete button */}
                {!confirmDelete ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                        className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                        title={UI_TEXT.profile.delete[language]}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                ) : (
                    <div className="flex gap-1 items-center flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-400 px-2 py-1 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {deleting ? "..." : UI_TEXT.profile.delete[language]}
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1"
                        >
                            {UI_TEXT.profile.cancel[language]}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full">
                    {cs.verses.length} {UI_TEXT.profile.versesCount[language]}
                </span>
                <span className="text-xs text-stone-400">
                    {new Date(cs.createdAt).toLocaleDateString()}
                </span>
            </div>

            {/* Share row */}
            <div className="border-t border-stone-50 pt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                {shareUrl ? (
                    <button
                        onClick={copyShareUrl}
                        className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {UI_TEXT.profile.copyLink[language]}
                    </button>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleShare(); }}
                        disabled={sharing}
                        className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {sharing ? UI_TEXT.profile.sharing[language] : UI_TEXT.profile.share[language]}
                    </button>
                )}
                {shareUrl && (
                    <span className="text-[10px] text-stone-400 truncate flex-1 min-w-0">{shareUrl}</span>
                )}
            </div>
        </div>
    );
}

import { UI_TEXT } from "@/data/translations";

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const { allProgress, loading: progressLoading } = useAllProgress();
    const { series: customSeries, loading: customSeriesLoading, deleteSeries, publishSeries } = useCustomSeries();
    const router = useRouter();
    const { language } = useLanguage();

    useEffect(() => {
        if (!authLoading && !user) router.push("/");
    }, [user, authLoading, router]);

    if (authLoading || profileLoading || progressLoading || customSeriesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800" />
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

    const handlePublish = async (cs: CustomSeries): Promise<void> => {
        await publishSeries(cs);
    };

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
                        {UI_TEXT.profile.backToHome[language]}
                    </button>
                    <span className="font-bold text-stone-900 tracking-wider uppercase text-sm">{UI_TEXT.profile.myProfile[language]}</span>
                    <div className="w-20" />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-3 space-y-6">
                        <ProfileHeader />
                        {profile && <SubscriptionManager profile={profile} />}
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-9 space-y-10">
                        <OverallStats allProgress={allProgress} profile={profile} />

                        {/* Built-in series with progress */}
                        {mySeries.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-serif font-bold text-stone-900 pl-2 border-l-4 border-amber-400">
                                    {UI_TEXT.profile.mySeries[language]}
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

                        {/* Custom Series */}
                        {customSeries.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-serif font-bold text-stone-900 pl-2 border-l-4 border-emerald-400">
                                    {UI_TEXT.profile.myCustomSeries[language]}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {customSeries.map(cs => (
                                        <CustomSeriesCard
                                            key={cs.id}
                                            cs={cs}
                                            onDelete={deleteSeries}
                                            onShare={handlePublish}
                                            language={language}
                                        />
                                    ))}
                                </div>
                                <div className="text-center mt-6">
                                    {profile?.isPremium ? (
                                        <Link href="/bible" className="text-sm text-stone-600 hover:text-stone-900 font-medium hover:underline underline-offset-2 flex justify-center items-center gap-2">
                                            {UI_TEXT.profile.createCustomSeries[language]}
                                        </Link>
                                    ) : (
                                        <Link href="/pricing" className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-2 flex justify-center items-center gap-2">
                                            {UI_TEXT.profile.createCustomPremium[language]}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Empty state and Bottom Create Link */}
                        {(mySeries.length === 0 && customSeries.length === 0) ? (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-serif font-bold text-stone-900 pl-2 border-l-4 border-amber-400">
                                    {UI_TEXT.profile.mySeries[language]}
                                </h2>
                                <div className="bg-white rounded-2xl p-8 text-center border border-stone-100 border-dashed">
                                    <p className="text-stone-500 mb-4">{UI_TEXT.profile.noSeries[language]}</p>
                                    <div className="flex gap-3 justify-center flex-wrap">
                                        <button
                                            onClick={() => router.push("/#series")}
                                            className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors text-sm"
                                        >
                                            {UI_TEXT.profile.browseSeries[language]}
                                        </button>
                                        {profile?.isPremium ? (
                                            <Link
                                                href="/bible"
                                                className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors text-sm"
                                            >
                                                {UI_TEXT.profile.createCustomSeries[language]}
                                            </Link>
                                        ) : (
                                            <Link
                                                href="/pricing"
                                                className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors text-sm"
                                            >
                                                {UI_TEXT.profile.createCustomPremium[language]}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            customSeries.length === 0 && (
                                <div className="pt-8 border-t border-stone-100 text-center">
                                    {profile?.isPremium ? (
                                        <Link href="/bible" className="text-sm text-stone-600 hover:text-stone-900 font-medium hover:underline underline-offset-2 flex justify-center items-center gap-2">
                                            {UI_TEXT.profile.createCustomSeries[language]}
                                        </Link>
                                    ) : (
                                        <Link href="/pricing" className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-2 flex justify-center items-center gap-2">
                                            {UI_TEXT.profile.createCustomPremium[language]}
                                        </Link>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
