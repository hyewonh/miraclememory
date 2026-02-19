"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UI_TEXT } from "@/data/translations"; // Import translations

interface HeroProps {
    onStartTrial?: () => void;
    language?: 'en' | 'ko' | 'zh' | 'es' | 'de' | 'fr'; // Add language prop
}

export function Hero({ onStartTrial, language = 'en' }: HeroProps) {
    const { user } = useAuth();
    // Helper to get text safely
    const t = UI_TEXT.hero;

    return (
        <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden text-center bg-[#fcf9f2]">
            {/* Background with Modern Gradient */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100"
                style={{ backgroundImage: "url('/images/hero_bg_beige.png')" }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">



                <div className="space-y-6 mb-12">
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-stone-900 leading-tight drop-shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 tracking-tight whitespace-pre-line">
                        {t.title[language]}
                    </h1>

                    <p className="text-xl md:text-2xl text-stone-600 font-serif italic max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300">
                        {t.subtitle[language]}
                    </p>
                </div>

                {/* Primary CTA - Bottom & Center (Restored Position) */}
                <div className="mb-12 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-400">
                    {!user ? (
                        <button
                            onClick={onStartTrial}
                            className="w-full py-5 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-xl shadow-xl transition-all hover:-translate-y-1"
                        >
                            {t.cta[language]}
                        </button>
                    ) : (
                        <Link
                            href="#series"
                            className="block w-full py-5 bg-stone-800 text-white hover:bg-stone-700 rounded-full font-bold text-xl shadow-xl transition-all"
                        >
                            Continue Journey
                        </Link>
                    )}
                </div>

                {/* Secondary Actions */}
                <div className="pt-4">
                    <Link href="#pricing" className="text-stone-400 hover:text-stone-600 text-sm font-medium transition-colors">
                        Support the Ministry
                    </Link>
                </div>
            </div>
        </section>
    );
}
