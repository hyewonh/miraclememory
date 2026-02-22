"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { UI_TEXT } from "@/data/translations";

interface InlineTypeTestProps {
    text: string;
    language: 'en' | 'ko' | 'zh' | 'es' | 'de' | 'fr';
    onClose: () => void;
    onComplete?: () => void; // Called when typing is fully correct
}

type CharState = "hidden" | "correct" | "wrong" | "active";

export function InlineTypeTest({ text, language, onClose, onComplete }: InlineTypeTestProps) {
    const t = UI_TEXT.bible;
    const tl = (obj: Record<string, string>) => obj[language] ?? obj["en"];

    const inputRef = useRef<HTMLInputElement>(null);
    const [typed, setTyped] = useState("");
    const [completed, setCompleted] = useState(false);
    const completedFired = useRef(false);

    const fullText = text;
    const totalTypeable = fullText.length;

    // Focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const fireConfetti = useCallback(() => {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };

        function fire(particleRatio: number, opts: confetti.Options) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (completed) return;
        const val = e.target.value;
        setTyped(val);

        if (val === fullText && !completedFired.current) {
            completedFired.current = true;
            setCompleted(true);
            fireConfetti();
            setTimeout(() => { fireConfetti(); }, 700);
            onComplete?.();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") onClose();
    };

    const getCharState = (idx: number): CharState => {
        if (idx >= typed.length) return "hidden";
        return typed[idx] === fullText[idx] ? "correct" : "wrong";
    };

    return (
        <div
            className="relative cursor-text select-none"
            onClick={() => inputRef.current?.focus()}
            role="button"
            tabIndex={-1}
        >
            {/* Hidden real input */}
            <input
                ref={inputRef}
                value={typed}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 opacity-0 w-full h-full cursor-text z-10 pointer-events-auto"
                aria-label="Type the verse here"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={completed}
            />

            {/* Visual render */}
            <div
                className={cn(
                    "text-xl md:text-2xl font-reading font-bold leading-relaxed min-h-[4rem] flex flex-wrap justify-center items-center gap-0 transition-all duration-300",
                    "ring-2 ring-offset-4 rounded-xl px-3 py-2",
                    completed
                        ? "ring-emerald-400 bg-emerald-50"
                        : "ring-rose-300 ring-offset-white animate-pulse-slow"
                )}
            >
                {Array.from(fullText).map((char, idx) => {
                    const state = getCharState(idx);
                    const isFirstOfWord = idx === 0 || fullText[idx - 1] === ' ';

                    if (char === ' ') {
                        return <span key={idx} className="w-3 inline-block" />;
                    }

                    if (state === "correct") {
                        return (
                            <span key={idx} className="text-stone-900 transition-all duration-75 animate-in fade-in">
                                {char}
                            </span>
                        );
                    }

                    if (state === "wrong") {
                        return (
                            <span key={idx} className="text-rose-500 font-bold underline decoration-wavy decoration-rose-400">
                                {typed[idx]}
                            </span>
                        );
                    }

                    // hidden: first char of word visible
                    if (isFirstOfWord) {
                        return <span key={idx} className="text-stone-400">{char}</span>;
                    }

                    return (
                        <span key={idx} className="inline-flex items-center justify-center" style={{ width: "0.55em", height: "1.2em" }}>
                            <span className="inline-block rounded-full bg-stone-300" style={{ width: "0.45em", height: "0.45em" }} />
                        </span>
                    );
                })}
            </div>

            {/* Status bar */}
            <div className="mt-3 flex items-center justify-between text-xs font-bold px-1">
                {completed ? (
                    <span className="text-emerald-600 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                        {tl(t.typeComplete)}
                    </span>
                ) : (
                    <>
                        <span className="text-stone-400">
                            {typed.length} / {totalTypeable} {tl(t.charCount)}
                        </span>
                        <span className="text-rose-400 cursor-pointer hover:text-rose-600" onClick={onClose}>
                            {tl(t.closeEsc)}
                        </span>
                    </>
                )}
            </div>

            {/* Progress bar */}
            {!completed && (
                <div className="mt-1 h-1 rounded-full bg-stone-100 overflow-hidden">
                    <div
                        className="h-full bg-rose-400 rounded-full transition-all duration-100"
                        style={{ width: `${(typed.length / totalTypeable) * 100}%` }}
                    />
                </div>
            )}

            {/* Tap to start hint */}
            {typed.length === 0 && (
                <p className="text-center text-xs text-stone-400 mt-2 animate-pulse">
                    {tl(t.tapToType)}
                </p>
            )}
        </div>
    );
}
