"use client";

import { useMemo } from "react";
import { AllSeriesProgress } from "@/hooks/useAllProgress";
import { VERSES, INITIAL_SERIES } from "@/data/seedData";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

interface MasteredVersesGridProps {
    allProgress: AllSeriesProgress;
}

export function MasteredVersesGrid({ allProgress }: MasteredVersesGridProps) {
    const { language } = useLanguage();
    const router = useRouter();

    const masteredVerses = useMemo(() => {
        const result: { verse: typeof VERSES[0]; seriesTitle: string; seriesId: string }[] = [];

        Object.entries(allProgress).forEach(([seriesId, prog]) => {
            const completedIds = prog.completedVerses[language] || [];
            const series = INITIAL_SERIES.find(s => s.id === seriesId);
            if (!series) return;

            completedIds.forEach(verseId => {
                const verse = VERSES.find(v => v.id === verseId);
                if (verse) {
                    result.push({
                        verse,
                        seriesTitle: series.title[language],
                        seriesId,
                    });
                }
            });
        });

        return result;
    }, [allProgress, language]);

    if (masteredVerses.length === 0) {
        return (
            <div className="text-center py-10 text-stone-400 text-sm">
                No verses memorized yet. Start a series to begin!
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {masteredVerses.map(({ verse, seriesTitle, seriesId }) => (
                <button
                    key={`${seriesId}-${verse.id}`}
                    onClick={() => router.push(`/series/${seriesId}`)}
                    className="text-left bg-white border border-stone-100 rounded-xl p-4 hover:border-amber-300 hover:shadow-md transition-all group"
                >
                    {/* Series badge */}
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1 truncate">
                        {seriesTitle}
                    </div>
                    {/* Reference */}
                    <div className="text-sm font-bold text-stone-800 mb-1">
                        {verse.reference[language]}
                    </div>
                    {/* Preview text */}
                    <div className="text-xs text-stone-400 leading-relaxed line-clamp-2">
                        {verse.text[language]}
                    </div>
                    {/* Memorized badge */}
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Memorized
                    </div>
                </button>
            ))}
        </div>
    );
}
