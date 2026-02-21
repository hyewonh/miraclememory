"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { VerseCard } from "@/components/verses/VerseCard";
import { Pricing } from "@/components/pricing/Pricing";
import { getDailyVerse } from "@/services/verseService";
import { useEffect, useState } from "react";
import { Verse } from "@/types";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { INITIAL_SERIES } from "@/data/seedData";
import { SeriesCard } from "@/components/series/SeriesCard";
import { Hero } from "@/components/layout/Hero";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { UI_TEXT } from "@/data/translations";
import { Navbar } from "@/components/layout/Navbar";
import { UserDashboard } from "@/components/layout/UserDashboard";

export default function Home() {
  const { user, logout } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { language } = useLanguage();

  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);
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
      {/* Navigation */}
      <Navbar isAbsolute={!user} />

      {/* Onboarding Modal (Trial Flow) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        startAtPayment={!!user}
      />

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col items-center justify-start pb-20 animate-in fade-in duration-700">

        {/* Hero Section (non-logged in) */}
        {!user && (
          <div className="w-full mb-12">
            <Hero onStartTrial={() => setIsOnboardingOpen(true)} language={language} />
          </div>
        )}

        {/* User Dashboard (logged-in users) */}
        {user && (
          <div className="w-full mb-10 mt-6">
            <UserDashboard />
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
            {INITIAL_SERIES
              .filter((series) => series.id !== "revelation-30")
              .map((series) => {
                // Free users: romans, healing, gospel, lent are open (4 free verses each)
                // Premium users: all series unlocked
                const FREE_SERIES = ["romans-30", "healing-100", "gospel-3-months", "lent-30"];
                const isLocked = !FREE_SERIES.includes(series.id) && !isPremium;

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

      {/* Footer */}
      <footer className="w-full py-12 text-center text-sm text-stone-500 border-t border-stone-100 bg-[#fcf9f2]">
        <p>&copy; {new Date().getFullYear()} Miracle Memory. Excellence for God.</p>
      </footer>
    </div >
  );
}
