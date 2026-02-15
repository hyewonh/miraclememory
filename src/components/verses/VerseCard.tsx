"use client";

import { Verse } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface VerseCardProps {
    verse: Verse;
    mode?: "read" | "memorize";
    className?: string;
}

export function VerseCard({ verse, mode = "read", className }: VerseCardProps) {
    const [isHidden, setIsHidden] = useState(false);

    // Simple memorization logic: obscure words if hidden
    const displayText = isHidden
        ? verse.text.split(" ").map(word => "_".repeat(word.length)).join(" ")
        : verse.text;

    return (
        <div className={cn("bg-white p-8 rounded-2xl shadow-sm border border-stone-100 max-w-2xl w-full mx-auto", className)}>
            <div className="flex justify-between items-start mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold uppercase tracking-wider">
                    {verse.category}
                </span>
                <span className="text-stone-400 text-sm font-medium">{verse.translation}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-2 leading-tight">
                {verse.reference}
            </h2>

            <p className="text-lg md:text-xl text-stone-600 leading-relaxed font-serif min-h-[120px] transition-all duration-300">
                {displayText}
            </p>

            {mode === "memorize" && (
                <div className="mt-8 pt-6 border-t border-stone-100 flex justify-center">
                    <button
                        onClick={() => setIsHidden(!isHidden)}
                        className="text-stone-500 hover:text-stone-800 font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        {isHidden ? (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Show Verse
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                Hide to Memorize
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
