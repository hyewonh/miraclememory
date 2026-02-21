"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface InlineTypeTestProps {
    text: string;         // The full verse text
    onClose: () => void;  // Called when user exits/completes
}

type CharState = "hidden" | "correct" | "wrong" | "active";

export function InlineTypeTest({ text, onClose }: InlineTypeTestProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [typed, setTyped] = useState("");
    const [completed, setCompleted] = useState(false);

    // Strip chars that are whitespace (we don't require typing spaces explicitly,
    // but we track a flattened "typeable" string: everything except position info)
    // We keep the full text for display but track typing position char-by-char.
    const fullText = text;
    const totalTypeable = fullText.length;

    // Focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Confetti burst helper
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

        // Check completion — typed matches the whole text
        if (val === fullText) {
            setCompleted(true);
            fireConfetti();
            setTimeout(() => {
                fireConfetti(); // Second burst
            }, 700);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") onClose();
    };

    // Determine char state at each index
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
            {/* Hidden real input — receives keystrokes */}
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

            {/* Visual render of the verse */}
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

                    // Space character — always render as space
                    if (char === ' ') {
                        return <span key={idx} className="w-3 inline-block" />;
                    }

                    if (state === "correct") {
                        return (
                            <span
                                key={idx}
                                className="text-stone-900 transition-all duration-75 animate-in fade-in"
                            >
                                {char}
                            </span>
                        );
                    }

                    if (state === "wrong") {
                        return (
                            <span
                                key={idx}
                                className="text-rose-500 font-bold underline decoration-wavy decoration-rose-400"
                            >
                                {typed[idx]}
                            </span>
                        );
                    }

                    // hidden: show first char of word, rest as dots
                    if (isFirstOfWord) {
                        return (
                            <span key={idx} className="text-stone-400">
                                {char}
                            </span>
                        );
                    }

                    // Non-first hidden char → grey dot
                    return (
                        <span
                            key={idx}
                            className="inline-flex items-center justify-center"
                            style={{ width: "0.55em", height: "1.2em" }}
                        >
                            <span
                                className="inline-block rounded-full bg-stone-300"
                                style={{ width: "0.45em", height: "0.45em" }}
                            />
                        </span>
                    );
                })}
            </div>

            {/* Status bar */}
            <div className="mt-3 flex items-center justify-between text-xs font-bold px-1">
                {completed ? (
                    <span className="text-emerald-600 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                        🎉 완벽합니다! 구절을 모두 외웠습니다!
                    </span>
                ) : (
                    <>
                        <span className="text-stone-400">
                            {typed.length} / {totalTypeable} 글자
                        </span>
                        <span className="text-rose-400 cursor-pointer hover:text-rose-600" onClick={onClose}>
                            ✕ 닫기 (Esc)
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
                    탭하고 타이핑을 시작하세요…
                </p>
            )}
        </div>
    );
}
