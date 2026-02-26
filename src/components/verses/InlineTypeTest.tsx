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
    const isComposingRef = useRef(false);
    const lastValueRef = useRef("");  // track last value via ref (not state)

    const fullText = text.normalize('NFC');

    // Reset state when text or language changes
    useEffect(() => {
        setTyped("");
        setCompleted(false);
        completedFired.current = false;
        isComposingRef.current = false;
        lastValueRef.current = "";
    }, [text, language]);

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

    // Auto-fill any character that is NOT a letter, digit, or whitespace
    // Covers: , . : ; ! ? ' ' " " - — etc.
    const isAutoFillChar = (char: string) => !/[\p{L}\p{N}\s]/u.test(char);

    // Use Intl.Segmenter to correctly split multi-byte characters like Korean
    const stringToChars = useCallback((str: string) => {
        if (!str) return [];
        const segmenter = new Intl.Segmenter(language === 'en' ? 'en' : 'ko', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(str)).map(seg => seg.segment);
    }, [language]);

    const fullTextChars = stringToChars(fullText);
    const totalTypeable = fullTextChars.length;

    // Normalize a char: NFC + strip invisible chars + unify whitespace variants
    const normalizeChar = useCallback((ch: string | undefined): string => {
        if (!ch) return '';
        // Strip zero-width / invisible Unicode chars that Korean IME may inject
        const stripped = ch.replace(/[\u200B\u200C\u200D\uFEFF\u200E\u200F\u00AD\u2060\u180E]/g, '');
        if (!stripped) return ' '; // entirely invisible → treat as space
        const nfc = stripped.normalize('NFC');
        // Treat all whitespace variants as regular space
        if (/^\s$/.test(nfc) || nfc === '\u00A0' || nfc === '\u3000') return ' ';
        // Unify curly/smart quotes and apostrophes to ASCII equivalents
        if (nfc === '\u2018' || nfc === '\u2019' || nfc === '\u02BC') return "'";
        if (nfc === '\u201C' || nfc === '\u201D') return '"';
        // Unify em-dash and en-dash to hyphen
        if (nfc === '\u2013' || nfc === '\u2014') return '-';
        return nfc;
    }, []);

    // Fire confetti when: char count matches AND no VISIBLY wrong chars
    // "Visibly wrong" = non-space positions where typed ≠ expected
    // Space positions are ignored because mismatches there are nearly invisible to the user
    useEffect(() => {
        if (completed || completedFired.current) return;
        const chars = stringToChars(typed);
        if (chars.length < fullTextChars.length) return;
        const hasVisibleWrong = chars.slice(0, fullTextChars.length).some((c, i) => {
            // Skip space positions entirely — mismatches at spaces are invisible
            if (normalizeChar(fullTextChars[i]) === ' ') return false;
            return normalizeChar(c) !== normalizeChar(fullTextChars[i]);
        });
        if (!hasVisibleWrong) {
            completedFired.current = true;
            setCompleted(true);
            fireConfetti();
            setTimeout(() => { fireConfetti(); }, 700);
            onComplete?.();
        }
    }, [typed, completed, fullTextChars, normalizeChar, stringToChars, fireConfetti, onComplete]);

    const applyAutoFill = useCallback((val: string): string => {
        let newTyped = val;
        let newTypedChars = stringToChars(newTyped);

        if (newTypedChars.length === 0) return newTyped;

        const prevLen = stringToChars(lastValueRef.current).length;
        const isDeleting = newTypedChars.length < prevLen;

        if (!isDeleting) {
            // Auto-fill following punctuation if last char matches
            const lastIdx = newTypedChars.length - 1;
            if (lastIdx < fullTextChars.length &&
                newTypedChars[lastIdx].normalize('NFC') === fullTextChars[lastIdx]) {
                while (newTypedChars.length < fullTextChars.length &&
                    isAutoFillChar(fullTextChars[newTypedChars.length])) {
                    newTyped += fullTextChars[newTypedChars.length];
                    newTypedChars = stringToChars(newTyped);
                }
                // After auto-filling punctuation, also auto-fill ONE trailing space
                // (e.g. after ", " the space is natural and should not require manual input)
                if (newTypedChars.length < fullTextChars.length &&
                    fullTextChars[newTypedChars.length] === ' ' &&
                    newTypedChars.length > 0 &&
                    isAutoFillChar(fullTextChars[newTypedChars.length - 1])) {
                    newTyped += ' ';
                    newTypedChars = stringToChars(newTyped);
                }
            }
        } else {
            // Backspace: strip trailing auto-fill chars AND trailing space after punctuation
            while (newTypedChars.length > 0 && (
                isAutoFillChar(newTypedChars[newTypedChars.length - 1]) ||
                (newTypedChars[newTypedChars.length - 1] === ' ' && newTypedChars.length >= 2 && isAutoFillChar(newTypedChars[newTypedChars.length - 2]))
            )) {
                newTyped = newTyped.slice(0, -newTypedChars[newTypedChars.length - 1].length);
                newTypedChars = stringToChars(newTyped);
            }
        }

        // Clamp to max length
        if (newTypedChars.length > fullTextChars.length) {
            newTyped = newTypedChars.slice(0, fullTextChars.length).join('');
        }

        return newTyped;
    }, [fullTextChars, stringToChars, isAutoFillChar]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (completed) return;
        const val = e.target.value;

        if (isComposingRef.current) {
            // During IME composition: just store the raw value, no auto-fill
            // But clamp to max length and check completion
            let newTyped = val;
            let newTypedChars = stringToChars(newTyped);
            if (newTypedChars.length > fullTextChars.length) {
                newTyped = newTypedChars.slice(0, fullTextChars.length).join('');
                newTypedChars = stringToChars(newTyped);
            }
            setTyped(newTyped);
            lastValueRef.current = newTyped;
            return;
        }

        // Not composing: apply auto-fill logic
        const processed = applyAutoFill(val);
        const processedChars = stringToChars(processed);

        setTyped(processed);
        lastValueRef.current = processed;
    };

    const handleCompositionStart = () => {
        isComposingRef.current = true;
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
        isComposingRef.current = false;
        const val = e.currentTarget.value;

        // Apply auto-fill now that composition is done
        const processed = applyAutoFill(val);
        const processedChars = stringToChars(processed);

        setTyped(processed);
        lastValueRef.current = processed;
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
        return normalizeChar(typedCharsState[idx]) === normalizeChar(fullTextChars[idx]) ? "correct" : "wrong";
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
                {/* Real hidden input — position offscreen to prevent IME overlay */}
                <input
                    ref={inputRef}
                    value={typed}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    className="sr-only"
                    style={{
                        position: 'absolute',
                        left: '-9999px',
                        top: '0',
                        width: '1px',
                        height: '1px',
                        opacity: 0,
                        pointerEvents: 'none',
                    }}
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
                        const isFirstOfWord = idx === 0 || fullTextChars[idx - 1] === ' ';
                        const isCursor = idx === cursorPos && isFocused && !completed;

                        if (char === ' ') {
                            return (
                                <span key={idx} className="relative inline-flex items-center justify-center" style={{ width: "0.8em" }}>
                                    {state === "hidden" && (
                                        <span className="text-stone-300 text-sm">·</span>
                                    )}
                                    {state === "correct" && (
                                        <span className="w-3 inline-block" />
                                    )}
                                    {state === "wrong" && (
                                        <span className="w-3 inline-block bg-rose-200 rounded" />
                                    )}
                                    {isCursor && (
                                        <span className="absolute left-0 top-0 h-full w-0.5 bg-amber-500 animate-pulse" />
                                    )}
                                </span>
                            );
                        }

                        if (state === "correct") {
                            return (
                                <span key={idx} className="relative">
                                    <span className="text-stone-900 transition-colors">{char}</span>
                                    {isCursor && (
                                        <span className="absolute -right-0.5 top-0 h-full w-0.5 bg-amber-500 animate-pulse" />
                                    )}
                                </span>
                            );
                        }

                        if (state === "wrong") {
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
