"use client";

import { useAuth } from "@/context/AuthContext";
import { INITIAL_SERIES, VERSES } from "@/data/seedData";
import { VerseDetail } from "@/components/verses/VerseDetail";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    const [visibleCount, setVisibleCount] = useState(12);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

    // Default to first verse if no progress
    const [activeVerse, setActiveVerse] = useState<Verse | null>(verses[0] || null);

    const visibleVerses = verses.slice(0, visibleCount);
    const hasMore = visibleCount < verses.length;

    const isPremium = profile?.isPremium || false;

    // Access Logic: First 4 verses (indices 0-3) are free. 5+ (index 4+) require premium/login.
    // Actually, prompt says "Sign in not required for first 4". 
    // And "If not logged in, clicking 5th... triggers 7-Day Free Trial".
    // So if user IS logged in but NOT premium, do they get access? 
    // Usually "Free Trial" implies they need a subscription. 
    // Let's assume: 
    // - Unauthenticated: Limit 4.
    // - Authenticated Free: Limit 4 (unless we have a specific "Free Tier" that allows more? The prompt implies 7-day trial is the gateway).
    // - Authenticated Premium: Unlimited.

    // So logic: Locked if (index >= 4 AND !isPremium).

    const handleRestrictedAction = () => {
        setIsOnboardingOpen(true);
    };

    const completedCount = getCompletedCount(language);
    const totalVerses = verses.length;
    const progressPercentage = Math.round((completedCount / totalVerses) * 100) || 0;
    const isCompleted = totalVerses > 0 && completedCount === totalVerses;

    // Trigger confetti on completion
    useEffect(() => {
        if (isCompleted) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500', '#ffffff'] // Gold theme
            });
        }
    }, [isCompleted]);

    const loadMore = () => {
        setVisibleCount(prev => prev + 12);
    };

    if (!series) {
        return <div className="p-20 text-center">Series not found</div>;
    }

    const t = UI_TEXT.detail;

    return (
        <div className="min-h-screen bg-[#fdfbf7]">
            {/* Onboarding Modal for Restrictions */}
            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
                startAtPayment={!!user}
            />

            {/* Navbar */}
            <Navbar className="bg-white border-b border-stone-100" />

            {/* Header */}
            <div className="bg-stone-900 text-white py-8 md:py-12 px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">{series.title[language]}</h1>
                    <p className="text-lg md:text-lg text-stone-400 font-serif max-w-2xl mx-auto mb-6">{series.description[language]}</p>

                    {/* Progress Bar */}
                    <div className="max-w-md mx-auto mb-8 md:mb-12">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                            <span>Progress</span>
                            <span>{progressPercentage}% ({completedCount}/{totalVerses})</span>
                        </div>
                        <div className="h-4 bg-stone-800 rounded-full overflow-hidden ring-1 ring-stone-700">
                            <div
                                className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        {isCompleted && (
                            <div className="mt-4 text-amber-400 font-bold animate-pulse">
                                🎉 Series Completed! Keep reviewing!
                            </div>
                        )}
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none" />
            </div>

            <main className="max-w-6xl mx-auto px-4 -mt-20 mb-24 relative z-10">
                {/* Featured Verse Card (Top) */}
                {activeVerse && (
                    <div className="mb-16">
                        <VerseDetail
                            verse={activeVerse}
                            language={language}
                            onRestrictedAction={(!isPremium && verses.indexOf(activeVerse) >= 4) ? handleRestrictedAction : undefined}
                            onLoginRequired={() => setIsOnboardingOpen(true)}
                        />
                    </div>
                )}

                {/* Grid Layout of Verses */}
                <div>
                    <h3 className="text-2xl font-serif font-bold text-stone-800 mb-8 border-b border-stone-200 pb-4 flex justify-between items-end">
                        <span>Curriculum Schedule</span>
                        <div className="flex items-center gap-4">
                            <span className="text-base font-sans font-normal text-stone-500">{verses.length} Verses</span>
                            <button
                                onClick={() => {
                                    if (!isPremium) {
                                        handleRestrictedAction();
                                    } else {
                                        window.open(`/series/${id}/print`, '_blank');
                                    }
                                }}
                                className="text-sm font-bold bg-stone-100 text-stone-600 px-3 py-1 rounded hover:bg-stone-200 transition-colors flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Print
                            </button>
                        </div>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleVerses.map((verse, idx) => {
                            const isVerseMemorized = isMemorized(verse.id);
                            const isLocked = idx >= 4 && !isPremium;

                            return (
                                <button
                                    key={verse.id}
                                    onClick={() => {
                                        if (isLocked) {
                                            handleRestrictedAction();
                                        } else {
                                            setActiveVerse(verse);
                                            // Scroll to top smoothly
                                            window.scrollTo({ top: 400, behavior: 'smooth' });
                                        }
                                    }}
                                    className={cn(
                                        "text-left p-6 rounded-2xl bg-white border transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group",
                                        activeVerse?.id === verse.id
                                            ? "border-stone-800 ring-1 ring-stone-800 shadow-md"
                                            : "border-stone-100 hover:border-stone-300 shadow-sm",
                                        isLocked && "opacity-75 bg-stone-50"
                                    )}
                                >
                                    {/* Locked Overlay */}
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20 group-hover:bg-white/40 transition-colors">
                                            <div className="bg-stone-900 text-white rounded-full p-3 shadow-xl transform group-hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}

                                    {/* Memorized Indicator Overlay */}
                                    {isVerseMemorized && !isLocked && (
                                        <div className="absolute top-0 right-0 bg-amber-100 text-amber-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider shadow-sm z-10">
                                            Memorized
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between w-full">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                                            activeVerse?.id === verse.id
                                                ? "bg-stone-800 text-white"
                                                : isVerseMemorized
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-stone-100 text-stone-400"
                                        )}>
                                            {isVerseMemorized ? (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                            Day {idx + 1}
                                        </div>
                                    </div>

                                    <div>
                                        <div className={cn(
                                            "font-serif font-bold text-xl mb-2 transition-colors",
                                            isVerseMemorized ? "text-stone-900" : "text-stone-900"
                                        )}>
                                            {verse.reference[language]}
                                        </div>
                                        <div className={cn(
                                            "text-sm leading-relaxed transition-colors",
                                            isVerseMemorized ? "text-stone-600" : "text-stone-500",
                                            isLocked && "blur-sm select-none"
                                        )}>
                                            {verse.text[language]}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 flex gap-2 overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity">
                                        {verse.tags?.map(tag => (
                                            <span key={tag} className="text-[10px] uppercase tracking-wider bg-stone-50 text-stone-500 px-2 py-1 rounded-md">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="mt-12 text-center">
                            <button
                                onClick={loadMore}
                                className="bg-stone-900 text-white px-8 py-3 rounded-full font-bold hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
                            >
                                Load More (+12)
                            </button>
                        </div>
                    )}

                    {verses.length === 0 && (
                        <div className="p-20 text-center text-stone-500 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                            No verses found for this series yet.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
