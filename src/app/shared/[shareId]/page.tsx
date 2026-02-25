"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCustomSeries, SharedSeries } from "@/hooks/useCustomSeries";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { VerseDetail } from "@/components/verses/VerseDetail";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { useProgress } from "@/hooks/useProgress";
import { Verse } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { UI_TEXT } from "@/data/translations";

const FREE_VERSE_LIMIT = 4;

export default function SharedSeriesPage() {
    const router = useRouter();
    const params = useParams();
    const shareId = params.shareId as string;

    const { user } = useAuth();
    const { profile } = useProfile();
    const { importSharedSeries } = useCustomSeries();
    const { language } = useLanguage();
    const isPremium = profile?.isPremium ?? false;

    const [shared, setShared] = useState<SharedSeries | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);

    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [activeVerse, setActiveVerse] = useState<Verse | null>(null);

    const { progress, isMemorized, getCompletedCount } = useProgress(shareId); // progress is tied to shareId for anon/auth

    const mapToVerse = (v: any, idx: number): Verse => ({ ...v, seriesId: shareId, order: idx + 1, tags: [] });

    useEffect(() => {
        if (!shareId) return;
        getDoc(doc(db, "shared_series", shareId)).then(snap => {
            if (!snap.exists()) { setNotFound(true); }
            else {
                const data = snap.data() as SharedSeries;
                setShared(data);
                if (data.verses.length > 0) setActiveVerse(mapToVerse(data.verses[0], 0));
            }
            setLoading(false);
        });
    }, [shareId]);

    const handleImport = async () => {
        if (!user) { router.push("/"); return; }
        if (!shared || importing) return;
        setImporting(true);
        await importSharedSeries(shared);
        setImported(true);
        setImporting(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800" />
        </div>
    );

    if (notFound || !shared) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4 px-6 text-center">
            <div className="text-5xl">📭</div>
            <h2 className="text-2xl font-bold text-stone-900">{UI_TEXT.shared.notFound[language]}</h2>
            <p className="text-stone-400 text-sm">{UI_TEXT.shared.notFoundDesc[language]}</p>
            <button onClick={() => router.push("/")} className="mt-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-bold text-sm">
                {UI_TEXT.shared.goHome[language]}
            </button>
        </div>
    );

    const totalVerses = shared?.verses.length || 0;
    const activeIndex = activeVerse && shared ? shared.verses.findIndex(v => v.id === activeVerse.id) : 0;
    const completedCount = getCompletedCount(language);

    return (
        <div className="h-screen bg-[#fdfbf7] flex flex-col overflow-hidden">
            <Navbar className="bg-white border-b border-stone-100" />

            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
                startAtPayment={!!user}
            />

            {/* Compact Header Bar */}
            <div className="bg-white border-b border-stone-100 px-4 md:px-8 py-2.5 flex items-center justify-between sticky top-[57px] z-30 shadow-sm gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium hidden sm:inline">{UI_TEXT.detail.back[language]}</span>
                    </button>
                    <span className="text-stone-300 hidden sm:inline">|</span>
                    <h1 className="text-sm font-bold text-stone-800 truncate">
                        {shared.title} <span className="text-xs text-stone-400 font-normal">{UI_TEXT.shared.by[language]} {shared.ownerName}</span>
                    </h1>
                </div>

                {!imported && (
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-4 py-1.5 rounded-full text-xs transition-all shadow-sm flex-shrink-0 disabled:opacity-50"
                    >
                        {importing ? "..." : user ? UI_TEXT.shared.addToMySeries[language] : UI_TEXT.shared.loginToAdd[language]}
                    </button>
                )}
                {imported && (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {UI_TEXT.shared.added[language]}
                    </span>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-3 pb-6 md:pt-4 md:pb-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 md:items-start">

                        {/* LEFT (desktop) / TOP (mobile): Verse Detail Hero */}
                        <div className="flex-1 min-w-0">
                            {activeVerse ? (
                                <>
                                    <VerseDetail
                                        verse={activeVerse}
                                        language={language}
                                        onRestrictedAction={(!isPremium && activeIndex >= FREE_VERSE_LIMIT) ? () => setIsOnboardingOpen(true) : undefined}
                                        onLoginRequired={() => setIsOnboardingOpen(true)}
                                    />

                                    {/* Prev / Next navigation */}
                                    <div className="mt-5 flex items-center justify-between">
                                        <button
                                            onClick={() => {
                                                if (activeIndex > 0) setActiveVerse(mapToVerse(shared.verses[activeIndex - 1], activeIndex - 1));
                                            }}
                                            disabled={activeIndex === 0}
                                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            {UI_TEXT.customSeries.previous[language]}
                                        </button>
                                        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
                                            {activeIndex + 1} / {totalVerses}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (activeIndex < shared.verses.length - 1) {
                                                    if (activeIndex + 1 >= FREE_VERSE_LIMIT && !isPremium) {
                                                        setIsOnboardingOpen(true);
                                                    } else {
                                                        setActiveVerse(mapToVerse(shared.verses[activeIndex + 1], activeIndex + 1));
                                                    }
                                                }
                                            }}
                                            disabled={activeIndex === shared.verses.length - 1}
                                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            {UI_TEXT.customSeries.next[language]}
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            ) : null}

                            {/* Mobile: Inline verse list */}
                            <div className="md:hidden mt-8">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">
                                    {shared.title} · {totalVerses} {UI_TEXT.customSeries.verses[language]}
                                </p>
                                <div className="flex flex-col divide-y divide-stone-100 rounded-2xl bg-white shadow-sm overflow-hidden border border-stone-100">
                                    {shared.verses.map((verse, idx) => {
                                        const isVerseMemorized = isMemorized(verse.id);
                                        const isLocked = idx >= FREE_VERSE_LIMIT && !isPremium;
                                        const isActive = activeVerse?.id === verse.id;
                                        return (
                                            <button
                                                key={verse.id}
                                                onClick={() => {
                                                    if (isLocked) {
                                                        setIsOnboardingOpen(true);
                                                    } else {
                                                        setActiveVerse(mapToVerse(verse, idx));
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-200",
                                                    isActive ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
                                                    isActive ? "bg-white/20 text-white" : isVerseMemorized ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"
                                                )}>
                                                    {isVerseMemorized && !isActive ? (
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={cn("text-xs font-bold", isActive ? "text-white" : "text-stone-700")}>
                                                        {verse.reference[language] || verse.reference['en']}
                                                    </div>
                                                    <div className={cn("text-[11px] mt-0.5 line-clamp-1", isActive ? "text-white/70" : "text-stone-400", isLocked && "blur-sm select-none")}>
                                                        {verse.text[language] || verse.text['en']}
                                                    </div>
                                                </div>
                                                {isLocked && (
                                                    <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                                                        <path fillRule="evenodd" d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8V6a3 3 0 10-6 0v3h6zm-3 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                {isVerseMemorized && !isLocked && !isActive && (
                                                    <span className="flex-shrink-0 text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase">done</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT (desktop only): Verse List Sidebar */}
                        <div className="hidden md:flex flex-col w-72 lg:w-80 flex-shrink-0 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden sticky top-4 max-h-[calc(100vh-120px)]">
                            <div className="px-4 py-3 border-b border-stone-50 flex-shrink-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                    {shared.title} · {totalVerses} {UI_TEXT.customSeries.verses[language]}
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {shared.verses.map((verse, idx) => {
                                    const isVerseMemorized = isMemorized(verse.id);
                                    const isLocked = idx >= FREE_VERSE_LIMIT && !isPremium;
                                    const isActive = activeVerse?.id === verse.id;
                                    return (
                                        <button
                                            key={verse.id}
                                            onClick={() => {
                                                if (isLocked) {
                                                    setIsOnboardingOpen(true);
                                                } else {
                                                    setActiveVerse(mapToVerse(verse, idx));
                                                }
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-200 border-b border-stone-50 last:border-0",
                                                isActive ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
                                                isActive ? "bg-white/20 text-white" : isVerseMemorized ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"
                                            )}>
                                                {isVerseMemorized && !isActive ? (
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn("text-xs font-bold truncate", isActive ? "text-white" : "text-stone-700")}>
                                                    {verse.reference[language] || verse.reference['en']}
                                                </div>
                                                <div className={cn("text-[11px] leading-relaxed mt-0.5 line-clamp-2", isActive ? "text-white/70" : "text-stone-400", isLocked && "blur-sm select-none")}>
                                                    {verse.text[language] || verse.text['en']}
                                                </div>
                                            </div>
                                            {isLocked && (
                                                <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                                                    <path fillRule="evenodd" d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8V6a3 3 0 10-6 0v3h6zm-3 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {isVerseMemorized && !isLocked && !isActive && (
                                                <span className="flex-shrink-0 text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase">done</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
