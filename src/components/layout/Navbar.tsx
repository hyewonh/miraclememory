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
                            <Link href="/profile" className="font-medium text-stone-900 flex items-center gap-2 hover:opacity-80 transition-opacity">
                                {/* Mobile: User Icon */}
                                <span className="sm:hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                </span>
                                {/* Desktop: Greeting Text */}
                                <span className="hidden sm:inline-block text-sm hover:underline underline-offset-4 decoration-amber-400 decoration-2">
                                    {UI_TEXT.nav.greeting[language]}, {user.displayName?.split(" ")[0]}
                                </span>
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
