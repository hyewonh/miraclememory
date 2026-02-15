"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { UI_TEXT } from "@/data/translations";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const { user, signInWithGoogle } = useAuth();
    const { language } = useLanguage();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'progress' | 'leaderboard' | 'friends'>('progress');

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
                <div className="text-center p-8">
                    <h1 className="text-3xl font-serif font-bold mb-4">Join the Community</h1>
                    <p className="text-stone-500 mb-8">Sign in to track your progress and compete with friends.</p>
                    <button
                        onClick={signInWithGoogle}
                        className="bg-stone-900 text-white px-8 py-3 rounded-full font-bold hover:bg-stone-800 transition-colors"
                    >
                        Sign In with Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbf7]">
            {/* Profile Header */}
            <div className="bg-white border-b border-stone-100">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-stone-100 overflow-hidden border-4 border-white shadow-lg">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-stone-300">
                                    {user.displayName?.[0] || '?'}
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-stone-900">{user.displayName}</h1>
                            <p className="text-stone-500">Kingdom Memory Member</p>
                            <div className="flex gap-4 mt-4">
                                <div className="px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Streak</div>
                                    <div className="text-xl font-bold text-amber-900">12 Days</div>
                                </div>
                                <div className="px-4 py-2 bg-stone-50 rounded-xl border border-stone-100">
                                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Verses</div>
                                    <div className="text-xl font-bold text-stone-900">48</div>
                                </div>
                                <button
                                    onClick={() => router.push('/')}
                                    className="px-6 py-2 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors self-end ml-auto"
                                >
                                    {UI_TEXT.nav.home[language]}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="max-w-4xl mx-auto px-6 flex gap-8">
                    {['progress', 'leaderboard', 'friends'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === tab
                                ? "border-stone-900 text-stone-900"
                                : "border-transparent text-stone-400 hover:text-stone-600"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {activeTab === 'progress' && (
                    <div className="grid gap-8">
                        {/* Language Distribution */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                            <h2 className="text-2xl font-serif font-bold mb-6">Memorization by Language</h2>
                            <div className="h-64 flex items-end justify-between px-8 gap-4">
                                {/* Mock Chart Bars */}
                                {['English', 'Korean', 'Chinese', 'Spanish'].map((lang, idx) => (
                                    <div key={lang} className="flex flex-col items-center gap-2 w-full">
                                        <div
                                            className={`w-full rounded-t-xl transition-all duration-1000 ${['bg-blue-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'][idx]
                                                }`}
                                            style={{ height: `${[80, 45, 10, 5][idx]}%` }}
                                        />
                                        <span className="text-xs font-bold text-stone-400 uppercase">{lang}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges / Crowns */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                            <h2 className="text-2xl font-serif font-bold mb-6">Achievements</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="aspect-square rounded-2xl bg-stone-50 flex flex-col items-center justify-center border-2 border-stone-100 group hover:border-amber-200 transition-colors">
                                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">👑</div>
                                        <div className="text-xs font-bold text-stone-400 uppercase text-center">Romans<br />Core 30</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                        <div className="p-6 border-b border-stone-100 bg-stone-50">
                            <h2 className="text-xl font-bold text-stone-800">Global Ranking</h2>
                        </div>
                        {[1, 2, 3, 4, 5].map((rank) => (
                            <div key={rank} className="flex items-center gap-4 p-6 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                                <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                                    rank === 2 ? 'bg-stone-200 text-stone-600' :
                                        rank === 3 ? 'bg-orange-100 text-orange-600' :
                                            'text-stone-400'
                                    }`}>
                                    {rank}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-stone-200" />
                                <div className="flex-1">
                                    <div className="font-bold text-stone-900">User {rank}</div>
                                    <div className="text-xs text-stone-500">1,2{rank}0 Verses Memorized</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-emerald-600">Level {10 - rank}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'friends' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 text-center">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            👋
                        </div>
                        <h2 className="text-xl font-bold text-stone-900 mb-2">Invite Friends</h2>
                        <p className="text-stone-500 mb-6">Memorizing is better together. Invite friends to track progress and compete.</p>
                        <button className="bg-stone-900 text-white px-6 py-2 rounded-full font-bold hover:bg-stone-800 transition-colors">
                            Copy Invite Link
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
