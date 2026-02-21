import { Series } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SeriesCardProps {
    series: Series;
    language: 'en' | 'ko' | 'zh' | 'es' | 'de' | 'fr';
    isLocked?: boolean;
    onUnlock?: () => void;
}

export function SeriesCard({ series, language, isLocked = false, onUnlock }: SeriesCardProps) {
    const CardContent = (
        <div className={cn(
            "relative h-36 md:h-auto md:aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200 shadow-lg transition-all duration-300 group",
            isLocked ? "cursor-pointer" : "hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
        )}>
            <img
                src={series.coverImage}
                alt={series.title[language]}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradient: dark at top (title area), fades to bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 via-[55%] to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-black/70 to-transparent" />

            {/* Locked: hover overlay with blur */}
            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm bg-black/50">
                    <div className="flex flex-col items-center gap-2 text-white">
                        <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-xs font-semibold tracking-wider uppercase text-amber-300">Premium</span>
                    </div>
                </div>
            )}

            {/* Locked: yellow lock badge top-right (always visible) */}
            {isLocked && (
                <div className="absolute top-3 right-3 z-30 bg-amber-400 p-1.5 rounded-full shadow-lg">
                    <svg className="w-3.5 h-3.5 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8V6a3 3 0 10-6 0v3h6zm-3 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                </div>
            )}

            <div className="absolute inset-0 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start p-4 md:p-5 z-10">
                <div className="flex-1 min-w-0 pr-2 md:pr-0">
                    <h3 className={cn(
                        "text-base md:text-xl font-bold text-white mb-0.5 md:mb-1 tracking-wide leading-tight",
                        "[text-shadow:0_2px_8px_rgba(0,0,0,1),0_1px_3px_rgba(0,0,0,0.9)]",
                        !isLocked && "group-hover:text-amber-300 transition-colors duration-200",
                        "truncate md:whitespace-normal"
                    )}>
                        {series.title[language]}
                    </h3>
                    <p className={cn(
                        "hidden md:block text-xs font-medium text-stone-200 line-clamp-2 leading-snug",
                        "[text-shadow:0_1px_6px_rgba(0,0,0,1),0_1px_2px_rgba(0,0,0,0.9)]"
                    )}>
                        {series.description[language]}
                    </p>
                    <p className="md:hidden text-[13px] font-medium text-stone-300 line-clamp-1 [text-shadow:0_1px_4px_rgba(0,0,0,1)]">
                        {series.description[language]}
                    </p>
                </div>

                <div className="flex-shrink-0 md:w-full md:mt-3 flex md:block items-center md:items-start gap-2 text-[10px] md:text-xs font-semibold">
                    <span className="bg-white/25 backdrop-blur-md border border-white/20 text-white px-2.5 md:px-3 py-1 rounded-full whitespace-nowrap shadow-md">
                        {series.totalVerses} Verses
                    </span>
                </div>
            </div>
        </div>
    );

    if (isLocked) {
        return (
            <div onClick={onUnlock}>
                {CardContent}
            </div>
        );
    }

    return (
        <Link href={`/series/${series.id}`}>
            {CardContent}
        </Link>
    );
}

