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
    // Expanded to include common punctuation in English, Korean, Chinese, Spanish, French, German
    const isAutoFillChar = (char: string) => /[\s,.:;?!"\-'`()\[\]{}★☆♡♥~！＠＃＄％＾＆＊（）＿＋＝－｀：；"＇＜＞，．？/]/.test(char) || char === ' ';

    // Use Intl.Segmenter to correctly split multi-byte characters like Korean
    const stringToChars = (str: string) => {
        if (!str) return [];
        const segmenter = new Intl.Segmenter(language === 'en' ? 'en' : 'ko', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(str)).map(seg => seg.segment);
    };

    const fullTextChars = stringToChars(fullText);
    const totalTypeable = fullTextChars.length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (completed) return;
        const val = e.target.value;

        // Fast path for native typing (especially IME on mobile/Korean)
        // We let the input value update and treat its length as the cursor position
        const typedChars = stringToChars(typed);

        let newTyped = val;
        let newTypedChars = stringToChars(newTyped);

        // Auto-fill logic
        if (newTypedChars.length > typedChars.length) { // user added chars
            // Check if next char in target is auto-fill
            while (newTypedChars.length < fullTextChars.length && isAutoFillChar(fullTextChars[newTypedChars.length])) {
                newTyped += fullTextChars[newTypedChars.length];
                newTypedChars = stringToChars(newTyped);
            }
        } else {
            // If user is deleting (backspace), and they delete into an auto-fill char, 
            // delete the auto-fill chars as well so they don't get stuck.
            while (newTypedChars.length > 0 && isAutoFillChar(newTypedChars[newTypedChars.length - 1])) {
                newTyped = newTyped.slice(0, -newTypedChars[newTypedChars.length - 1].length);
                newTypedChars = stringToChars(newTyped);
            }
        }

        // Prevent typing beyond the length
        if (newTypedChars.length > fullTextChars.length) {
            newTyped = newTypedChars.slice(0, fullTextChars.length).join('');
            newTypedChars = stringToChars(newTyped);
        }

        setTyped(newTyped);

        // Check completion right away using characters
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

    const typedCharsState = stringToChars(typed);

    const getCharState = (idx: number): CharState => {
        if (idx >= typedCharsState.length) return "hidden";
        // Convert input Korean characters to initial consonants for comparison if needed, 
        // but for now strict comparison is safer for completion. However, Korean IME builds characters
        // incrementally. If the full character is matched, it's correct.
        return typedCharsState[idx] === fullTextChars[idx] ? "correct" : "wrong";
    };

    // Current cursor position = typedCharsState.length (next char to type)
    const cursorPos = typedCharsState.length;

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
                    {fullTextChars.map((char, idx) => {
                        const state = getCharState(idx);
                        // For first letter hinting, we treat space-separated items as words.
                        // Wait, to calculate if a character is first of word, we look at the raw string
                        const isFirstOfWord = idx === 0 || fullTextChars[idx - 1] === ' ';
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
                                    <span className={cn("text-stone-900 transition-colors", char === ' ' && "opacity-0")}>{char === ' ' ? '_' : char}</span>
                                    {isCursor && (
                                        <span className="absolute -right-0.5 top-0 h-full w-0.5 bg-amber-500 animate-pulse" />
                                    )}
                                </span>
                            );
                        }

                        if (state === "wrong") {
                            // If the expected char is a space but they typed something else, show what they typed in red
                            const displayChar = typedCharsState[idx] === ' ' ? '_' : (typedCharsState[idx] ?? char);
                            return (
                                <span key={idx} className="relative">
                                    <span className="text-rose-500 font-bold underline decoration-wavy decoration-rose-400">
                                        {displayChar}
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
                    {cursorPos === fullTextChars.length && isFocused && !completed && (
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
                            {typedCharsState.length} / {totalTypeable} {tl(t.charCount)}
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
            <div className="mt-1 h-1 rounded-full bg-stone-100 overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-100",
                        completed ? "bg-emerald-400" : "bg-rose-400"
                    )}
                    style={{ width: `${(typedCharsState.length / totalTypeable) * 100}%` }}
                />
            </div>
        </div>
    );
}
