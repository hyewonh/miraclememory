"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { VerseCard } from "@/components/verses/VerseCard";
import { Pricing } from "@/components/pricing/Pricing";
import { getDailyVerse } from "@/services/verseService";
import { useEffect, useState } from "react";
import { Verse } from "@/types";
import { Seeder } from "@/components/admin/Seeder";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { INITIAL_SERIES } from "@/data/seedData";
import { SeriesCard } from "@/components/series/SeriesCard";
import { Hero } from "@/components/layout/Hero";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { UI_TEXT } from "@/data/translations";

export default function Home() {
  const { user, logout } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { language } = useLanguage();

  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    async function fetchVerse() {
      const verse = await getDailyVerse();
      setDailyVerse(verse);
    }
    fetchVerse();
  }, []);

  const isPremium = profile?.isPremium || false;

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Navigation (Rebranded & Simplified) */}
      <nav className={cn("w-full max-w-7xl px-6 py-6 grid grid-cols-3 items-center z-50 transition-all duration-300", !user ? "absolute top-0 left-1/2 -translate-x-1/2 text-stone-900" : "relative")}>

        {/* Left: Language Selector */}
        <div className="justify-self-start">
          <LanguageSelector />
        </div>

        {/* Center: Logo */}
        <div className="justify-self-center text-center">
          <div className="text-xl md:text-2xl font-sans font-bold tracking-[0.1em] text-stone-900 uppercase whitespace-nowrap">
            Miracle Memory
          </div>
        </div>

        {/* Right: User Menu */}
        <div className="justify-self-end flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden sm:inline-block">{UI_TEXT.nav.greeting[language]}, {user.displayName?.split(" ")[0]}</span>
              <button
                onClick={() => logout()}
                className="bg-secondary text-secondary-foreground px-5 py-2 rounded-full text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
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

      {/* Auth Modal (Standard Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Onboarding Modal (Trial Flow) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col items-center justify-start pb-20 animate-in fade-in duration-700">

        {/* Hero Section */}
        {!user && (
          <div className="w-full mb-12">
            <Hero onStartTrial={() => setIsOnboardingOpen(true)} language={language} />
          </div>
        )}

        {/* Series Showcase (Visible to ALL users) */}
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10" id="series">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800">
              {UI_TEXT.series.title[language]}
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              {UI_TEXT.series.subtitle[language]}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {INITIAL_SERIES.map((series, idx) => {
              // First 4 are free (0, 1, 2, 3). 4+ are locked.
              const isLocked = idx >= 4 && !isPremium;

              return (
                <SeriesCard
                  key={series.id}
                  series={series}
                  language={language}
                  isLocked={isLocked}
                  onUnlock={() => setIsOnboardingOpen(true)}
                />
              );
            })}
          </div>
        </div>

      </main>

      <Pricing />
      <Seeder />

      {/* Footer */}
      <footer className="w-full py-12 text-center text-sm text-stone-500 border-t border-stone-100 bg-[#fcf9f2]">
        <p>&copy; {new Date().getFullYear()} Miracle Memory. Excellence for God.</p>
      </footer>
    </div>
  );
}
