"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Series } from "@/types";
import { SeriesProgress } from "@/hooks/useProgress";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SeriesProgressCardProps {
    series: Series;
    progress: SeriesProgress;
}

export function SeriesProgressCard({ series, progress }: SeriesProgressCardProps) {
    const { language } = useLanguage();

    const completedCount = progress.completedVerses[language]?.length || 0;
    const totalCount = series.totalVerses;
    const percentage = Math.min(100, Math.round((completedCount / totalCount) * 100));

    // Determine status color
    let statusColor = "bg-stone-200";
    if (percentage > 0) statusColor = "bg-blue-500";
    if (percentage === 100) statusColor = "bg-emerald-500";

    return (
        <Link href={`/series/${series.id}`} className="group block">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                {/* Image & Overlay */}
                <div className="relative h-32 bg-stone-100 overflow-hidden">
                    {series.coverImage ? (
                        <img
                            src={series.coverImage}
                            alt={series.title[language]}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400">
                            No Image
                        </div>
                    )}

                    {/* Completion Badge */}
                    {progress.isCompleted && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Completed
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-serif font-bold text-stone-900 mb-1 group-hover:text-primary transition-colors">
                        {series.title[language]}
                    </h3>

                    <div className="mt-auto pt-4 space-y-2">
                        <div className="flex justify-between text-xs font-medium text-stone-500">
                            <span>{percentage}% Complete</span>
                            <span>{completedCount} / {totalCount} Verses</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-500", statusColor)}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
