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

                    {/* 3-column grid: Stats | CTA | Today's Verse */}
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_280px] gap-4 md:gap-0 md:divide-x md:divide-stone-200">

                        {/* ── COL 1: Stat pills ── */}
                        <div className="flex md:flex-col items-center md:items-start justify-center gap-3 md:pr-6">
                            {/* Streak */}
                            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-sm">
                                <span className="text-2xl">🔥</span>
                                <div>
                                    <div className="text-xl font-black text-amber-500 leading-none">{stats.streak}</div>
                                    <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{TEXTS.streak[lang]}</div>
                                </div>
                            </div>

                            {/* Verses memorized */}
                            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-sm">
                                <span className="text-2xl">📖</span>
                                <div>
                                    <div className="text-xl font-black text-emerald-500 leading-none">{stats.totalVerses}</div>
                                    <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{TEXTS.verses[lang]}</div>
                                </div>
                            </div>

                            {/* Review badge — only if there are items */}
                            {reviewItems.length > 0 && (
                                <button
                                    onClick={() => setShowReviewModal(true)}
                                    className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 shadow-sm hover:bg-amber-100 transition-all"
                                >
                                    <span className="text-2xl">⏰</span>
                                    <div>
                                        <div className="text-xl font-black text-amber-600 leading-none">{reviewItems.length}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">{TEXTS.reviewDue[lang]}</div>
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* ── COL 2: Resume / Start CTA ── */}
                        <div className="flex flex-col justify-center md:px-8">
                            {stats.lastSeries ? (
                                <>
                                    <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-1">
                                        {TEXTS.continueWhere[lang]}
                                    </p>
                                    <h3 className="text-base md:text-lg font-bold text-stone-800 mb-3 truncate max-w-full">
                                        {stats.lastSeries.title[language]}
                                    </h3>
                                    <button
                                        onClick={() => router.push(`/series/${stats.lastSeriesId}`)}
                                        className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white font-bold px-6 py-2.5 rounded-full transition-all hover:scale-105 shadow-md text-sm w-fit"
                                    >
                                        {TEXTS.resumeLearning[lang]}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-stone-500 text-sm mb-3">{TEXTS.startPrompt[lang]}</p>
                                    <button
                                        onClick={() => document.getElementById("series")?.scrollIntoView({ behavior: "smooth" })}
                                        className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white font-bold px-6 py-2.5 rounded-full transition-all hover:scale-105 shadow-md text-sm w-fit"
                                    >
                                        {TEXTS.browseSeries[lang]}
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* ── COL 3: Today's Verse card ── */}
                        {dailyVerse && (
                            <div className="flex flex-col gap-2.5 md:pl-6">
                                {/* Label */}
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                        {TEXTS.todayVerse[lang]}
                                    </span>
                                </div>

                                {/* Reference */}
                                <p className="text-xs font-semibold text-stone-700 font-serif italic">
                                    — {dailyVerse.reference[language]}
                                </p>

                                {/* Text */}
                                <p className="text-stone-600 text-xs leading-relaxed line-clamp-4 font-reading flex-1">
                                    {dailyVerse.text[language]}
                                </p>

                                {/* CTA */}
                                <button
                                    onClick={() => router.push(`/series/${dailyVerse.seriesId}`)}
                                    className="w-full text-center text-[11px] font-bold text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 rounded-xl py-2 transition-all mt-auto"
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
