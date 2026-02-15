import { Series } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SeriesCardProps {
    series: Series;
    language: 'en' | 'ko' | 'zh' | 'es';
    isLocked?: boolean;
    onUnlock?: () => void;
}

export function SeriesCard({ series, language, isLocked = false, onUnlock }: SeriesCardProps) {
    const CardContent = (
        <div className={cn(
            "relative h-28 md:h-auto md:aspect-[3/4] overflow-hidden rounded-xl bg-stone-200 shadow-md transition-all duration-300",
            isLocked ? "opacity-90 cursor-default" : "hover:shadow-xl cursor-pointer group"
        )}>
            <img
                src={series.coverImage}
                alt={series.title[language]}
                className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-transform duration-700",
                    isLocked ? "grayscale-[0.5]" : "group-hover:scale-105"
                )}
            />
            <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

            {/* Lock Overlay */}
            {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                        <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-end p-4 md:p-6 z-10">
                <div className="flex-1 min-w-0 pr-2 md:pr-0">
                    <h3 className="text-lg md:text-2xl font-sans font-bold text-white mb-0.5 md:mb-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wide group-hover:text-amber-300 transition-colors truncate md:whitespace-normal">
                        {series.title[language]}
                    </h3>
                    <p className="hidden md:block text-sm font-medium text-stone-100 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] opacity-95">
                        {series.description[language]}
                    </p>
                    <p className="md:hidden text-xs font-medium text-stone-200 line-clamp-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] opacity-95">
                        {series.description[language]}
                    </p>
                </div>

                <div className="flex-shrink-0 md:w-full md:mt-4 flex md:block items-center md:items-start gap-2 text-[10px] md:text-xs font-medium text-white/80">
                    <span className="bg-white/20 px-2 md:px-3 py-1 rounded-full backdrop-blur-md border border-white/10 whitespace-nowrap">
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
