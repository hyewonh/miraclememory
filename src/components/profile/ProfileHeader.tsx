"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { UI_TEXT } from "@/data/translations";
import { useLanguage } from "@/context/LanguageContext";

export function ProfileHeader() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { language } = useLanguage();

    if (!user) return null;

    const isPremium = profile?.isPremium;
    const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : "U";

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center text-4xl font-serif font-bold text-stone-400 border-4 border-white shadow-lg">
                {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full rounded-full object-cover" />
                ) : (
                    initial
                )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
                    {user.displayName || "User"}
                </h1>
                <p className="text-stone-500 text-sm">
                    {user.email}
                </p>
                <div className="pt-2">
                    {isPremium ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Premium Member
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-xs font-bold uppercase tracking-wider">
                            Free Plan
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
