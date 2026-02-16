"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { UI_TEXT } from "@/data/translations";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarProps {
    className?: string;
    isAbsolute?: boolean;
}

export function Navbar({ className, isAbsolute = false }: NavbarProps) {
    const { user, logout } = useAuth();
    const { language } = useLanguage();
    const router = useRouter();

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

    return (
        <>
            <nav className={cn(
                "w-full max-w-7xl px-6 py-6 grid grid-cols-3 items-center z-50 transition-all duration-300 mx-auto",
                isAbsolute ? "absolute top-0 left-1/2 -translate-x-1/2 text-stone-900" : "relative",
                className
            )}>

                {/* Left: Language Selector */}
                <div className="justify-self-start">
                    <LanguageSelector />
                </div>

                {/* Center: Logo */}
                <div className="justify-self-center text-center">
                    <Link href="/" className="text-xl md:text-2xl font-sans font-bold tracking-[0.1em] text-stone-900 uppercase whitespace-nowrap hover:opacity-80 transition-opacity">
                        Miracle Memory
                    </Link>
                </div>

                {/* Right: User Menu */}
                <div className="justify-self-end flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="text-sm font-medium hidden sm:inline-block hover:underline underline-offset-4 decoration-amber-400 decoration-2 text-stone-900">
                                {UI_TEXT.nav.greeting[language]}, {user.displayName?.split(" ")[0]}
                            </Link>
                            <button
                                onClick={() => logout()}
                                className="bg-stone-100 text-stone-600 px-5 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-stone-200 transition-colors"
                            >
                                {UI_TEXT.nav.signOut[language]}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="bg-stone-900 text-white px-5 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-stone-800 transition-colors shadow-lg"
                        >
                            {UI_TEXT.nav.signIn[language]}
                        </button>
                    )}
                </div>
            </nav>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSwitchToOnboarding={() => {
                    setIsAuthModalOpen(false);
                    setIsOnboardingOpen(true);
                }}
            />

            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
            />
        </>
    );
}
