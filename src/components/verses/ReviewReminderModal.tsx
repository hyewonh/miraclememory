"use client";

import { useRouter } from "next/navigation";
import { ReviewItem } from "@/hooks/useReviewReminder";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
    items: ReviewItem[];
    onDismiss: (verseId: string) => void;
    onDismissAll: () => void;
}

const intervalLabel: Record<1 | 3 | 7, { en: string; ko: string }> = {
    1: { en: "1-day review", ko: "1일 복습" },
    3: { en: "3-day review", ko: "3일 복습" },
    7: { en: "7-day review", ko: "7일 복습" },
};

const TEXTS = {
    title: { en: "📖 Time to Review!", ko: "📖 복습할 시간이에요!" },
    subtitle: {
        en: "Reviewing verses at the right interval locks them into long-term memory.",
        ko: "정해진 주기에 맞춰 복습하면 장기 기억에 저장돼요.",
    },
    reviewNow: { en: "Practice Again", ko: "다시 연습하기" },
    skipAll: { en: "Maybe later", ko: "나중에 할게요" },
    skip: { en: "Skip", ko: "건너뛰기" },
    badge: { en: "Review", ko: "복습" },
};

export function ReviewReminderModal({ items, onDismiss, onDismissAll }: Props) {
    const router = useRouter();
    const { language } = useLanguage();
    const lang = language === "ko" ? "ko" : "en";

    if (items.length === 0) return null;

    const handleReview = (item: ReviewItem) => {
        onDismiss(item.verse.id);
        router.push(`/series/${item.series.id}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onDismissAll}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header gradient */}
                <div className="bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-5 text-white">
                    <h2 className="text-xl font-bold">{TEXTS.title[lang]}</h2>
                    <p className="text-sm text-white/80 mt-1">{TEXTS.subtitle[lang]}</p>
                </div>

                {/* Items */}
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                    {items.map((item) => (
                        <div
                            key={item.verse.id}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                        >
                            {/* Interval badge */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center">
                                <span className="text-amber-600 font-black text-sm leading-none">+{item.reviewInterval}</span>
                                <span className="text-amber-500 text-[10px] font-semibold leading-none mt-0.5">day</span>
                            </div>

                            {/* Verse info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">
                                    {intervalLabel[item.reviewInterval][lang]} · {item.series.title[language]}
                                </p>
                                <p className="text-sm font-semibold text-stone-800 truncate">
                                    {item.verse.reference[language]}
                                </p>
                                <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                                    {item.verse.text[language]}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                                <button
                                    onClick={() => handleReview(item)}
                                    className="text-xs font-bold bg-stone-900 text-white px-3 py-1.5 rounded-full hover:bg-stone-700 transition-colors whitespace-nowrap"
                                >
                                    {TEXTS.reviewNow[lang]}
                                </button>
                                <button
                                    onClick={() => onDismiss(item.verse.id)}
                                    className="text-xs text-stone-400 hover:text-stone-600 text-center transition-colors"
                                >
                                    {TEXTS.skip[lang]}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-stone-50 border-t border-stone-100">
                    <button
                        onClick={onDismissAll}
                        className="w-full text-sm text-stone-400 hover:text-stone-600 font-medium transition-colors"
                    >
                        {TEXTS.skipAll[lang]}
                    </button>
                </div>
            </div>
        </div>
    );
}
