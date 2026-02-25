"use client";

import { useAllProgress } from "@/hooks/useAllProgress";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/context/LanguageContext";
import { useReviewReminder } from "@/hooks/useReviewReminder";
import { INITIAL_SERIES, VERSES } from "@/data/seedData";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ReviewReminderModal } from "@/components/verses/ReviewReminderModal";

const TEXTS = {
    continueWhere: { en: "Continue where you left off", ko: "이어서 외우기" },
    resumeLearning: { en: "▶  Resume Learning", ko: "▶  이어서 학습하기" },
    browseSeries: { en: "Browse Series", ko: "시리즈 보기" },
    startPrompt: {
        en: "Start memorizing scripture — one verse at a time.",
        ko: "오늘부터 한 구절씩 말씀을 외워보세요.",
    },
    todayVerse: { en: "Today's Verse", ko: "오늘의 말씀" },
    streak: { en: "Day Streak", ko: "연속 학습" },
    verses: { en: "Verses", ko: "구절" },
    reviewDue: { en: "Review Due", ko: "복습 대기" },
};


/** Pick a "daily" verse from VERSES using the day-of-year as seed */
function getDailyVerse() {
    if (!VERSES.length) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return VERSES[dayOfYear % VERSES.length];
}

export function UserDashboard() {
    const { allProgress, loading } = useAllProgress();
    const { profile } = useProfile();
    const { language } = useLanguage();
    const router = useRouter();
    const { reviewItems, dismiss, dismissAll } = useReviewReminder();
    const [showReviewModal, setShowReviewModal] = useState(false);

    const lang = language === "ko" ? "ko" : "en";

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

        const lastSeries = lastSeriesId ? INITIAL_SERIES.find((s) => s.id === lastSeriesId) : null;

        let resumeVerseIndex = 0;
        if (lastSeries && allProgress[lastSeriesId]) {
            const verses = VERSES.filter((v) => v.seriesId === lastSeriesId);
            const completedIds = allProgress[lastSeriesId].completedVerses[language] || [];
            const firstUnmemorized = verses.findIndex((v) => !completedIds.includes(v.id));
            resumeVerseIndex = firstUnmemorized >= 0 ? firstUnmemorized : verses.length - 1;
        }

        return { totalVerses, streak: profile?.streak || 0, lastSeries, lastSeriesId, resumeVerseIndex };
    }, [allProgress, language, profile]);

    const dailyVerse = useMemo(() => getDailyVerse(), []);

    if (loading) return null;

    return (
        <>
            {/* Review Modal (portal-like overlay) */}
            {showReviewModal && reviewItems.length > 0 && (
                <ReviewReminderModal
                    items={reviewItems}
                    onDismiss={(id) => dismiss(id)}
                    onDismissAll={() => { dismissAll(); setShowReviewModal(false); }}
                />
            )}

            <div className="w-full max-w-7xl mx-auto px-4 md:px-10">
                <div className="bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-3xl p-4 md:p-5 shadow-sm">

                    {/* 3-column grid equal thirds: Stats | CTA | Today's Verse */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:divide-x md:divide-stone-200 md:items-start">

                        {/* ── COL 1 (1/3): Stat items ── */}
                        <div className="flex flex-col gap-3 md:pr-6">
                            {/* Streak + Verses: side-by-side on mobile, stacked on desktop */}
                            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                                {/* Daily Streak */}
                                <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-sm">
                                    <span className="text-2xl">🔥</span>
                                    <div>
                                        <div className="text-xl font-black text-amber-500 leading-none">{stats.streak}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{TEXTS.streak[lang]}</div>
                                    </div>
                                </div>

                                {/* Memorized Verses */}
                                <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-sm">
                                    <span className="text-2xl">📖</span>
                                    <div>
                                        <div className="text-xl font-black text-emerald-500 leading-none">{stats.totalVerses}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{TEXTS.verses[lang]}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Review badge — only if there are items */}
                            {reviewItems.length > 0 && (
                                <button
                                    onClick={() => setShowReviewModal(true)}
                                    className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 shadow-sm hover:bg-amber-100 transition-all"
                                >
                                    <span className="text-2xl">⏰</span>
                                    <div>
                                        <div className="text-xl font-black text-amber-600 leading-none">{reviewItems.length}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">{TEXTS.reviewDue[lang]}</div>
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* ── COL 2 (1/3): Resume / Start CTA ── */}
                        <div className="flex flex-col justify-center items-start md:px-8">
                            {stats.lastSeries ? (
                                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm md:bg-transparent md:border-0 md:shadow-none md:p-0 w-full">
                                    <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-2">
                                        {TEXTS.continueWhere[lang]}
                                    </p>
                                    <div className="flex items-center justify-between gap-3 w-full">
                                        <h3 className="text-base md:text-lg font-bold text-stone-800 truncate min-w-0">
                                            {stats.lastSeries.title[language]}
                                        </h3>
                                        <button
                                            onClick={() => router.push(`/series/${stats.lastSeriesId}`)}
                                            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white font-bold px-5 py-2 rounded-full transition-all hover:scale-105 shadow-md text-xs whitespace-nowrap flex-shrink-0"
                                        >
                                            {TEXTS.resumeLearning[lang]}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm md:bg-transparent md:border-0 md:shadow-none md:p-0 w-full">
                                    <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-2">
                                        {lang === "ko" ? "첫 단계를 시작하세요" : "Begin your journey"}
                                    </p>
                                    <div className="flex items-center justify-between gap-3 w-full">
                                        <h3 className="text-base md:text-lg font-bold text-stone-800 truncate min-w-0">
                                            {lang === "ko" ? "시리즈를 선택하세요" : "Pick a Series"}
                                        </h3>
                                        <button
                                            onClick={() => document.getElementById("series")?.scrollIntoView({ behavior: "smooth" })}
                                            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white font-bold px-5 py-2 rounded-full transition-all hover:scale-105 shadow-md text-xs whitespace-nowrap flex-shrink-0"
                                        >
                                            {lang === "ko" ? "시리즈 보기" : "Browse Series"}
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs text-stone-500 hidden md:block mt-1">
                                        {lang === "ko" ? "한 구절씩, 말씨를 외워보세요." : "Memorize scripture one verse at a time."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ── COL 3 (1/3): Today's Verse ── */}
                        {dailyVerse && (
                            <div className="flex flex-col gap-2.5 bg-white border border-stone-200 rounded-2xl p-4 shadow-sm md:ml-6 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                        {TEXTS.todayVerse[lang]}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-stone-700 font-serif italic">
                                    — {dailyVerse.reference[language]}
                                </p>
                                <p className="text-stone-600 text-xs leading-relaxed line-clamp-2 font-reading">
                                    {dailyVerse.text[language]}
                                </p>
                                <button
                                    onClick={() => router.push(`/series/${dailyVerse.seriesId}`)}
                                    className="w-full text-center text-[11px] font-bold text-white bg-stone-800 hover:bg-stone-700 rounded-xl py-2 transition-all mt-auto"
                                >
                                    {lang === "ko" ? "이 구절 외우기 →" : "Memorize this verse →"}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}
