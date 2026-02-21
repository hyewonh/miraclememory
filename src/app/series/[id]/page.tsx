"use client";

import { useAuth } from "@/context/AuthContext";
import { INITIAL_SERIES, VERSES } from "@/data/seedData";
import { VerseDetail } from "@/components/verses/VerseDetail";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Verse } from "@/types";
import { cn } from "@/lib/utils";

import confetti from "canvas-confetti";
import { useProgress } from "@/hooks/useProgress";
import { useLanguage } from "@/context/LanguageContext";
import { UI_TEXT } from "@/data/translations";

import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { useProfile } from "@/hooks/useProfile";

import { Navbar } from "@/components/layout/Navbar";

export default function SeriesPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { profile } = useProfile();
    const { language } = useLanguage();
    const id = params?.id as string;

    const series = INITIAL_SERIES.find(s => s.id === id);
    const verses = VERSES.filter(v => v.seriesId === id);

    const { progress, isMemorized, getCompletedCount } = useProgress(id);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

    // Smart Resume: start null, set after progress loads
    const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
    const hasResumed = useRef(false);

    // Smart Resume: jump to first unmemorized verse on initial progress load
    useEffect(() => {
        if (hasResumed.current || !progress || verses.length === 0) return;
        hasResumed.current = true;
        const completedIds = progress.completedVerses[language] || [];
        const firstUnmemorized = verses.find(v => !completedIds.includes(v.id));
        setActiveVerse(firstUnmemorized || verses[0]);
    }, [progress, language, verses]);

    const isPremium = profile?.isPremium || false;

    const handleRestrictedAction = () => {
        setIsOnboardingOpen(true);
    };

    const completedCount = getCompletedCount(language);
    const totalVerses = verses.length;
    const progressPercentage = Math.round((completedCount / totalVerses) * 100) || 0;
    const isCompleted = totalVerses > 0 && completedCount === totalVerses;

    useEffect(() => {
        if (isCompleted) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500', '#ffffff'],
            });
        }
    }, [isCompleted]);

    if (!series) {
        return <div className="p-20 text-center">Series not found</div>;
    }

    const activeIndex = activeVerse ? verses.indexOf(activeVerse) : 0;

    return (
        <div className="h-screen bg-[#fdfbf7] flex flex-col overflow-hidden">
            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
                startAtPayment={!!user}
            />

            {/* Navbar */}
            <Navbar className="bg-white border-b border-stone-100" />

            {/* Compact Header Bar */}
            <div className="bg-white border-b border-stone-100 px-4 md:px-8 py-2.5 flex items-center gap-4 sticky top-[57px] z-30 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors flex-shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium hidden sm:inline">Back</span>
                </button>

                <span className="text-stone-300 hidden sm:inline">|</span>

                <h1 className="text-sm font-bold text-stone-800 truncate flex-shrink min-w-0">
                    {series.title[language]}
                </h1>

                <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-stone-500 whitespace-nowrap flex-shrink-0">
                        {completedCount}/{totalVerses}
                    </span>
                </div>

                {isCompleted && (
                    <span className="text-amber-500 text-sm font-bold animate-pulse flex-shrink-0">🎉</span>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 md:items-start">

                        {/* LEFT (desktop) / TOP (mobile): Verse Detail Hero */}
                        <div className="flex-1 min-w-0">
                            {activeVerse ? (
                                <>
                                    <VerseDetail
                                        verse={activeVerse}
                                        language={language}
                                        onRestrictedAction={(!isPremium && verses.indexOf(activeVerse) >= 4) ? handleRestrictedAction : undefined}
                                        onLoginRequired={() => setIsOnboardingOpen(true)}
                                    />

                                    {/* Prev / Next navigation */}
                                    <div className="mt-5 flex items-center justify-between">
                                        <button
                                            onClick={() => {
                                                if (activeIndex > 0) setActiveVerse(verses[activeIndex - 1]);
                                            }}
                                            disabled={activeIndex === 0}
                                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Previous
                                        </button>
                                        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
                                            {activeIndex + 1} / {totalVerses}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (activeIndex < verses.length - 1) {
                                                    if (activeIndex + 1 >= 4 && !isPremium) {
                                                        handleRestrictedAction();
                                                    } else {
                                                        setActiveVerse(verses[activeIndex + 1]);
                                                    }
                                                }
                                            }}
                                            disabled={activeIndex === verses.length - 1}
                                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            Next
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-stone-400">
                                    Select a verse to begin
                                </div>
                            )}

                            {/* Mobile: Inline verse list below the card */}
                            <div className="md:hidden mt-8">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">
                                    Memory Queue · {totalVerses} verses
                                </p>
                                <div className="flex flex-col divide-y divide-stone-100 rounded-2xl bg-white shadow-sm overflow-hidden border border-stone-100">
                                    {verses.map((verse, idx) => {
                                        const isVerseMemorized = isMemorized(verse.id);
                                        const isLocked = idx >= 4 && !isPremium;
                                        const isActive = activeVerse?.id === verse.id;
                                        return (
                                            <button
                                                key={verse.id}
                                                onClick={() => {
                                                    if (isLocked) {
                                                        handleRestrictedAction();
                                                    } else {
                                                        setActiveVerse(verse);
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
                                                        {verse.reference[language]}
                                                    </div>
                                                    <div className={cn("text-[11px] mt-0.5 line-clamp-1", isActive ? "text-white/70" : "text-stone-400", isLocked && "blur-sm select-none")}>
                                                        {verse.text[language]}
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
                                    Memory Queue · {totalVerses} verses
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {verses.map((verse, idx) => {
                                    const isVerseMemorized = isMemorized(verse.id);
                                    const isLocked = idx >= 4 && !isPremium;
                                    const isActive = activeVerse?.id === verse.id;
                                    return (
                                        <button
                                            key={verse.id}
                                            onClick={() => {
                                                if (isLocked) {
                                                    handleRestrictedAction();
                                                } else {
                                                    setActiveVerse(verse);
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
                                                    {verse.reference[language]}
                                                </div>
                                                <div className={cn("text-[11px] leading-relaxed mt-0.5 line-clamp-2", isActive ? "text-white/70" : "text-stone-400", isLocked && "blur-sm select-none")}>
                                                    {verse.text[language]}
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
