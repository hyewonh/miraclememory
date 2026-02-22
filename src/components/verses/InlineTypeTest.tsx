"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { UI_TEXT } from "@/data/translations";

interface InlineTypeTestProps {
    text: string;
    language: 'en' | 'ko' | 'zh' | 'es' | 'de' | 'fr';
    onClose: () => void;
    onComplete?: () => void;
}

type CharState = "hidden" | "correct" | "wrong";

export function InlineTypeTest({ text, language, onClose, onComplete }: InlineTypeTestProps) {
    const t = UI_TEXT.bible;
    const tl = (obj: Record<string, string>) => obj[language] ?? obj["en"];

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [typed, setTyped] = useState("");
    const [completed, setCompleted] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const completedFired = useRef(false);

    const fullText = text;
    const totalTypeable = fullText.length;

    // Focus on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
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

    // Characters that should be auto-filled/ignored when typing
    const isAutoFillChar = (char: string) => /[,.:;?!"\-]/.test(char);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (completed) return;
        const val = e.target.value;

        let newTyped = val;

        // Auto-fill logic
        // If user typed a character, check if the next expected character in fullText is an auto-fill char.
        // If so, append it to newTyped (and keep doing so if there are multiple consecutive auto-fill chars).
        if (newTyped.length > typed.length) { // user is adding chars
            while (newTyped.length < fullText.length && isAutoFillChar(fullText[newTyped.length])) {
                newTyped += fullText[newTyped.length];
            }
        } else {
            // If user is deleting (backspace), and they delete into an auto-fill char, 
            // we should delete the auto-fill chars as well so they don't get stuck.
            while (newTyped.length > 0 && isAutoFillChar(newTyped[newTyped.length - 1])) {
                newTyped = newTyped.slice(0, -1);
            }
        }

        setTyped(newTyped);
        if (newTyped === fullText && !completedFired.current) {
            completedFired.current = true;
            setCompleted(true);
            fireConfetti();
            setTimeout(() => { fireConfetti(); }, 700);
            onComplete?.();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (completed) onClose();
        }
    };

    const getCharState = (idx: number): CharState => {
        if (idx >= typed.length) return "hidden";
        return typed[idx] === fullText[idx] ? "correct" : "wrong";
    };

    // Current cursor position = typed.length (next char to type)
    const cursorPos = typed.length;

    return (
        <div className="w-full">
            {/* Clickable typing area */}
            <div
                ref={containerRef}
                className={cn(
                    "relative cursor-text select-none rounded-xl px-4 py-4 ring-2 ring-offset-2 ring-offset-white transition-all duration-200",
                    completed
                        ? "ring-emerald-400 bg-emerald-50"
                        : isFocused
                            ? "ring-amber-400"
                            : "ring-rose-300"
                )}
                onClick={() => { inputRef.current?.focus(); }}
                role="button"
                tabIndex={-1}
                aria-label="Type the verse"
            >
                {/* Real hidden input */}
                <input
                    ref={inputRef}
                    value={typed}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-text z-10"
                    aria-label="Type the verse here"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    disabled={completed}
                    inputMode="text"
                />

                {/* Visual render — character by character */}
                <div className="text-xl md:text-2xl font-reading font-bold leading-relaxed flex flex-wrap justify-center items-center min-h-[4rem]">
                    {Array.from(fullText).map((char, idx) => {
                        const state = getCharState(idx);
                        const isFirstOfWord = idx === 0 || fullText[idx - 1] === ' ';
                        const isCursor = idx === cursorPos && isFocused && !completed;

                        if (char === ' ') {
                            return (
                                <span key={idx} className="relative">
                                    <span className="w-3 inline-block" />
                                    {isCursor && (
                                        <span className="absolute left-0 top-0 h-full w-0.5 bg-amber-500 animate-pulse" />
                                    )}
                                </span>
                            );
                        }

                        if (state === "correct") {
                            return (
                                <span key={idx} className="relative">
                                    <span className="text-stone-900">{char}</span>
                                    {isCursor && (
                                        <span className="absolute -right-0.5 top-0 h-full w-0.5 bg-amber-500 animate-pulse" />
                                    )}
                                </span>
                            );
                        }

                        if (state === "wrong") {
                            return (
                                <span key={idx} className="relative">
                                    <span className="text-rose-500 font-bold underline decoration-wavy decoration-rose-400">
                                        {typed[idx] ?? char}
                                    </span>
                                    {isCursor && (
                                        <span className="absolute -right-0.5 top-0 h-full w-0.5 bg-rose-500 animate-pulse" />
                                    )}
                                </span>
                            );
                        }

                        // hidden: first char of word → show as hint, rest → dots
                        if (isFirstOfWord) {
                            return (
                                <span key={idx} className="relative">
                                    <span className="text-stone-400">{char}</span>
                                    {isCursor && (
                                        <span className="absolute left-0 top-0 h-full w-0.5 bg-amber-500 animate-pulse" />
                                    )}
                                </span>
                            );
                        }

                        return (
                            <span key={idx} className="relative inline-flex items-center justify-center" style={{ width: "0.55em", height: "1.2em" }}>
                                <span className="inline-block rounded-full bg-stone-300" style={{ width: "0.45em", height: "0.45em" }} />
                                {isCursor && (
                                    <span className="absolute left-0 top-0 h-full w-0.5 bg-amber-500 animate-pulse" />
                                )}
                            </span>
                        );
                    })}

                    {/* Cursor at end (after all chars) */}
                    {cursorPos === fullText.length && isFocused && !completed && (
                        <span className="inline-block w-0.5 h-6 bg-amber-500 animate-pulse ml-0.5 align-middle" />
                    )}
                </div>

                {/* Tap-to-type hint when empty */}
                {typed.length === 0 && !isFocused && (
                    <p className="text-center text-xs text-stone-400 mt-2 animate-pulse">
                        {tl(t.tapToType)}
                    </p>
                )}
            </div>

            {/* Status bar */}
            <div className="mt-3 flex items-center justify-between text-xs font-bold px-1">
                {completed ? (
                    <span className="flex items-center justify-between w-full">
                        <span className="text-emerald-600 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                            {tl(t.typeComplete)}
                        </span>
                        <button
                            className="text-stone-500 hover:text-stone-700 transition-colors"
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                        >
                            {tl(t.closeEsc)}
                        </button>
                    </span>
                ) : (
                    <>
                        <span className="text-stone-400">
                            {typed.length} / {totalTypeable} {tl(t.charCount)}
                        </span>
                        <button
                            className="text-stone-300 transition-colors cursor-not-allowed"
                            disabled={true}
                        >
                            {tl(t.closeEsc)}
                        </button>
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
        </div>
    );
}
