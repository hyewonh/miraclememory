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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when route changes or screen resizes (optional but good UX)
    // For now, let's keep it simple.

    const handleLinkClick = (href: string) => {
        setIsMenuOpen(false);
        router.push(href);
    }

    return (
        <>
            <nav className={cn(
                "w-full max-w-7xl px-6 py-6 flex items-center justify-between z-50 transition-all duration-300 mx-auto",
                isAbsolute ? "absolute top-0 left-1/2 -translate-x-1/2 text-stone-900" : "relative",
                className
            )}>
                {/* Mobile: Hamburger Button */}
                <button
                    className="md:hidden p-2 -ml-2 text-stone-900"
                    onClick={() => setIsMenuOpen(true)}
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Left: Language Selector (Desktop Only) */}
                <div className="hidden md:block justify-self-start">
                    <LanguageSelector />
                </div>

                {/* Center: Logo (Absolute Center for Mobile, Normal for Desktop) */}
                <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:text-center">
                    <Link href="/" className="text-xl md:text-2xl font-sans font-bold tracking-[0.1em] text-stone-900 uppercase whitespace-nowrap hover:opacity-80 transition-opacity">
                        Miracle Memory
                    </Link>
                </div>

                {/* Right: User Menu (Desktop Only) */}
                <div className="hidden md:flex items-center gap-4 justify-self-end">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="font-medium text-stone-900 flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <span className="text-sm hover:underline underline-offset-4 decoration-amber-400 decoration-2">
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

                {/* Mobile: Placeholder for Right side balance (if needed) or Icon */}
                <div className="md:hidden w-8"></div> {/* Spacer to balance hamburger */}
            </nav>

            {/* Mobile Sidebar Menu (Overlay) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Menu Panel */}
                    <div className="absolute top-0 left-0 w-[80%] max-w-sm h-full bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                        <div className="p-6 flex items-center justify-between border-b border-stone-100">
                            <span className="text-lg font-bold tracking-widest uppercase">Menu</span>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2 text-stone-500">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Section 1: Authentication / Profile */}
                            <div className="space-y-4">
                                {user ? (
                                    <>
                                        <div className="flex items-center gap-3 mb-6 p-4 bg-stone-50 rounded-xl">
                                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold">
                                                {user.displayName?.[0] || "U"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-stone-900">{user.displayName}</div>
                                                <div className="text-xs text-stone-500">{user.email}</div>
                                            </div>
                                        </div>

                                        <button onClick={() => handleLinkClick("/profile")} className="w-full text-left py-3 px-2 text-lg font-medium text-stone-700 border-b border-stone-100 hover:text-amber-600 transition-colors">
                                            My Profile
                                        </button>
                                        <button onClick={() => handleLinkClick("/profile")} className="w-full text-left py-3 px-2 text-lg font-medium text-stone-700 border-b border-stone-100 hover:text-amber-600 transition-colors">
                                            Manage Subscription
                                        </button>

                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => { setIsMenuOpen(false); setIsAuthModalOpen(true); }}
                                            className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
                                        >
                                            Sign In
                                        </button>
                                        <div className="text-center text-sm text-stone-500">
                                            New here? <button onClick={() => { setIsMenuOpen(false); setIsOnboardingOpen(true); }} className="text-amber-600 font-bold underline">Create Account</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Settings / Language */}
                            <div>
                                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Settings</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-stone-600 font-medium">Language</span>
                                    <LanguageSelector />
                                </div>
                            </div>
                        </div>

                        {/* Footer: Logout */}
                        {user && (
                            <div className="p-6 border-t border-stone-100">
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="w-full py-3 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-red-500 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
