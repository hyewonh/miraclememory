
"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ko', label: 'Korean' },
    { code: 'zh', label: 'Chinese' },
    { code: 'es', label: 'Spanish' },
] as const;

export function LanguageSelector() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors text-sm font-medium text-stone-700"
            >
                <span className="inline">{currentLang.label}</span>
                <svg
                    className={cn("w-4 h-4 text-stone-400 transition-transform", isOpen && "rotate-180")}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-stone-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-stone-50 transition-colors",
                                language === lang.code ? "bg-stone-50 font-bold text-stone-900" : "text-stone-600"
                            )}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
