"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { UI_TEXT } from "@/data/translations";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import Link from "next/link";
import {
    getUserRewardProfile,
    applyPromoCode,
    UserRewardProfile,
    POINT_THRESHOLDS,
} from "@/services/rewardsService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TIER_LABELS: Record<string, string> = {
    friend: "Friend 🌱",
    champion: "Champion ⭐",
    ambassador: "Ambassador 🏆",
};

const TIER_COLORS: Record<string, string> = {
    friend: "bg-stone-100 text-stone-700 border-stone-300",
    champion: "bg-amber-100 text-amber-800 border-amber-400",
    ambassador: "bg-rose-100 text-rose-800 border-rose-400",
};

export default function RewardsPage() {
    const { user } = useAuth();
    const { language } = useLanguage();
    const router = useRouter();
    const t = UI_TEXT.rewards;

    const [profile, setProfile] = useState<UserRewardProfile | null>(null);
    const [promoCodes, setPromoCodes] = useState<{ code: string; type: string; used: boolean }[]>([]);
    const [redeemCode, setRedeemCode] = useState("");
    const [redeemStatus, setRedeemStatus] = useState<{ message: string; ok: boolean } | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) { router.push("/"); return; }
        loadProfile();
    }, [user]);

    async function loadProfile() {
        if (!user) return;
        setLoading(true);
        const p = await getUserRewardProfile(user.uid);
        setProfile(p);
        const codesSnap = await getDocs(collection(db, "users", user.uid, "promoCodes"));
        setPromoCodes(codesSnap.docs.map(d => d.data() as { code: string; type: string; used: boolean }));
        setLoading(false);
    }

    async function handleRedeem() {
        if (!user || !redeemCode.trim()) return;
        const result = await applyPromoCode(user.uid, redeemCode.trim().toUpperCase());
        if (result.success) {
            setRedeemStatus({ message: `✅ ${redeemCode} (${result.type})`, ok: true });
            setRedeemCode("");
            loadProfile();
        } else {
            setRedeemStatus({ message: `❌ ${result.error}`, ok: false });
        }
    }

    function copyReferralLink() {
        if (!profile) return;
        const link = `${window.location.origin}/join?ref=${profile.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 rounded-full border-4 border-rose-400 border-t-transparent" />
            </div>
        );
    }

    if (!profile) {
        return <div className="min-h-screen flex items-center justify-center text-stone-500">Profile not found</div>;
    }

    const referralLink = `${typeof window !== "undefined" ? window.location.origin : "https://miraclememory.org"}/join?ref=${profile.referralCode}`;
    const nextMilestone = POINT_THRESHOLDS.find(t => t.points > profile.points);
    const progressToNext = nextMilestone
        ? Math.round((profile.points / nextMilestone.points) * 100)
        : 100;
    const nextTierConversions = profile.tier === "friend" ? 3 : profile.tier === "champion" ? 10 : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">

            {/* ── Top Navigation Bar ── */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100 shadow-sm">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                    {/* Back to Home */}
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-rose-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t.backHome[language]}
                    </Link>

                    {/* Title */}
                    <span className="text-base font-bold text-stone-900 tracking-wide">
                        {t.title[language]}
                    </span>

                    {/* Language Selector */}
                    <LanguageSelector />
                </div>
            </header>

            {/* ── Page Content ── */}
            <main className="max-w-lg mx-auto px-4 py-8 space-y-5">

                {/* Tier + Points Card */}
                <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                                {t.currentTier[language]}
                            </p>
                            <span className={cn(
                                "inline-block mt-1 px-3 py-1 rounded-full border font-bold text-sm",
                                TIER_COLORS[profile.tier]
                            )}>
                                {TIER_LABELS[profile.tier]}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                                {t.points[language]}
                            </p>
                            <p className="text-3xl font-bold text-rose-500">{profile.points.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Points progress */}
                    {nextMilestone && (
                        <div>
                            <div className="flex justify-between text-xs text-stone-400 mb-1">
                                <span>{t.nextReward[language]}</span>
                                <span>{profile.points.toLocaleString()} / {nextMilestone.points.toLocaleString()}P</span>
                            </div>
                            <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full transition-all duration-700"
                                    style={{ width: `${progressToNext}%` }}
                                />
                            </div>
                            <p className="text-xs text-stone-400 mt-1">
                                {nextMilestone.reward === "1year" ? t.oneYear[language] : t.oneMonth[language]}
                            </p>
                        </div>
                    )}

                    {/* Tier progress */}
                    {nextTierConversions && (
                        <div className="text-xs text-stone-500 bg-stone-50 rounded-xl p-3">
                            {profile.tier === "friend"
                                ? `${t.toChampion[language]} ${profile.referralConversions}/3`
                                : `${t.toAmbassador[language]} ${profile.referralConversions}/10`}
                        </div>
                    )}
                    {profile.tier === "ambassador" && (
                        <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl p-3">
                            {t.ambassadorActive[language]}
                        </div>
                    )}
                </div>

                {/* Referral Link */}
                <div className="bg-white rounded-2xl shadow-md p-6">
                    <h2 className="font-bold text-stone-800 mb-1">{t.myLink[language]}</h2>
                    <p className="text-xs text-stone-400 mb-3">{t.linkDesc[language]}</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-600 truncate font-mono">
                            {referralLink}
                        </div>
                        <button
                            onClick={copyReferralLink}
                            className={cn(
                                "shrink-0 h-12 px-4 rounded-xl font-bold text-sm transition-all",
                                copied ? "bg-emerald-500 text-white" : "bg-rose-500 text-white hover:bg-rose-600"
                            )}
                        >
                            {copied ? t.copied[language] : t.copy[language]}
                        </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                        <div className="bg-stone-50 rounded-xl p-3">
                            <p className="text-2xl font-bold text-stone-800">{profile.referralSignups}</p>
                            <p className="text-xs text-stone-400 mt-1">{t.friendsJoined[language]}</p>
                        </div>
                        <div className="bg-rose-50 rounded-xl p-3">
                            <p className="text-2xl font-bold text-rose-600">{profile.referralConversions}</p>
                            <p className="text-xs text-stone-400 mt-1">{t.paidFriends[language]}</p>
                        </div>
                    </div>
                </div>

                {/* How to Earn Points */}
                <div className="bg-white rounded-2xl shadow-md p-6">
                    <h2 className="font-bold text-stone-800 mb-3">{t.howToEarn[language]}</h2>
                    <ul className="space-y-2 text-sm">
                        {[
                            { icon: "👥", label: t.earnFriendJoin[language], pts: 500 },
                            { icon: "💳", label: t.earnFriendPaid[language], pts: 3000 },
                            { icon: "📖", label: t.earnVerses[language], pts: 200 },
                            { icon: "✅", label: t.earnSeries[language], pts: 1000 },
                        ].map(item => (
                            <li key={item.label} className="flex items-center justify-between">
                                <span className="text-stone-600">{item.icon} {item.label}</span>
                                <span className="font-bold text-amber-600">+{item.pts.toLocaleString()}P</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* My Promo Codes */}
                {promoCodes.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="font-bold text-stone-800 mb-3">{t.myCodes[language]}</h2>
                        <ul className="space-y-2">
                            {promoCodes.map(c => (
                                <li key={c.code} className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl border font-mono text-sm",
                                    c.used
                                        ? "bg-stone-50 border-stone-200 text-stone-400 line-through"
                                        : "bg-emerald-50 border-emerald-300 text-emerald-800"
                                )}>
                                    <span>{c.code}</span>
                                    <span className="text-xs font-sans">
                                        {c.type === "1year" ? "1yr" : c.type === "1month" ? "1mo" : "∞"}
                                        {c.used ? ` ${t.codeUsed[language]}` : ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Redeem Code */}
                <div className="bg-white rounded-2xl shadow-md p-6">
                    <h2 className="font-bold text-stone-800 mb-1">{t.enterCode[language]}</h2>
                    <p className="text-xs text-stone-400 mb-3">{t.enterCodeDesc[language]}</p>
                    <div className="flex gap-2">
                        <input
                            value={redeemCode}
                            onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                            placeholder="XXXX-XXXX"
                            className="flex-1 h-12 px-4 rounded-xl border-2 border-stone-200 font-mono text-sm text-stone-800 focus:border-rose-400 outline-none"
                        />
                        <button
                            onClick={handleRedeem}
                            className="h-12 px-6 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-all"
                        >
                            {t.apply[language]}
                        </button>
                    </div>
                    {redeemStatus && (
                        <p className={cn("mt-2 text-sm font-medium", redeemStatus.ok ? "text-emerald-600" : "text-rose-500")}>
                            {redeemStatus.message}
                        </p>
                    )}
                </div>

                {/* Bottom padding */}
                <div className="h-8" />

            </main>
        </div>
    );
}
