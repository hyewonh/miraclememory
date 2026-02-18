"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface UserDetailModalProps {
    user: any;
    onClose: () => void;
}

export default function UserDetailModal({ user, onClose }: UserDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [progressStats, setProgressStats] = useState<any>(null);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!user?.id) return;
            try {
                const querySnapshot = await getDocs(collection(db, "users", user.id, "series_progress"));

                let totalMemorized = 0;
                const seriesBreakdown: any[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const completedVerses = data.completedVerses || {};
                    // Aggregate counts from all languages or just 'en' depending on requirement. 
                    // Usually users stick to one language, so summing unique verse IDs across langs might be safely approximated by taking the max or sum length.
                    // For now, let's sum 'en' as primary, or sum all distinct IDs if we want to be precise.
                    // Actually `useProgress` structure is: { en: [...], ko: [...] }

                    // Let's just count total unique verses memorized (assuming verse IDs are unique across langs? No, usually same ID).
                    // If a user memorized John 3:16 in EN and KO, does that count as 1 or 2? 
                    // Let's count total items in the arrays for now to show effort.

                    let seriesCount = 0;
                    Object.values(completedVerses).forEach((arr: any) => {
                        if (Array.isArray(arr)) seriesCount += arr.length;
                    });

                    totalMemorized += seriesCount;
                    seriesBreakdown.push({
                        id: doc.id,
                        count: seriesCount,
                        isCompleted: data.isCompleted
                    });
                });

                setProgressStats({
                    totalMemorized,
                    seriesBreakdown
                });
            } catch (error) {
                console.error("Error fetching progress:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [user]);

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-stone-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold font-serif">{user.name || "Anonymous User"}</h2>
                        <div className="text-stone-500 text-sm">{user.id}</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* User Profile Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-stone-50 p-4 rounded-xl">
                            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Email</div>
                            <div className="font-medium truncate" title={user.email}>{user.email}</div>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-xl">
                            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Joined</div>
                            <div className="font-medium">
                                {user.createdAt instanceof Date
                                    ? user.createdAt.toLocaleDateString()
                                    : new Date(user.createdAt?.seconds * 1000 || user.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-xl">
                            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Status</div>
                            <div>
                                {user.isPremium ? (
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                        <span>👑</span> Premium
                                    </span>
                                ) : (
                                    <span className="text-stone-500 font-bold">Free Plan</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Survey Data */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span>📋</span> Survey Responses
                        </h3>
                        {user.survey ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem label="Faith Stage" value={user.survey.faithStage} />
                                <InfoItem label="Goal" value={user.survey.goal} />
                                <InfoItem label="Age" value={user.survey.age} />
                                <InfoItem label="Location" value={user.survey.location} />
                                <InfoItem label="Focus" value={user.survey.focus} />
                                <InfoItem label="Struggle" value={user.survey.struggle} />
                            </div>
                        ) : (
                            <div className="text-stone-500 italic">No survey data available.</div>
                        )}
                    </div>

                    {/* Memorization Stats */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span>🧠</span> Memorization Progress
                        </h3>
                        {loading ? (
                            <div className="animate-pulse flex space-x-4">
                                <div className="h-12 w-full bg-stone-100 rounded-xl"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-violet-50 border border-violet-100 p-4 rounded-xl flex items-center justify-between">
                                    <span className="font-bold text-violet-900">Total Verses Memorized</span>
                                    <span className="text-2xl font-bold text-violet-700">{progressStats?.totalMemorized || 0}</span>
                                </div>

                                {progressStats?.seriesBreakdown?.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {progressStats.seriesBreakdown.map((series: any) => (
                                            <div key={series.id} className="bg-white border border-stone-200 p-3 rounded-lg flex justify-between items-center text-sm">
                                                <span className="capitalize font-medium">{series.id.replace(/-/g, ' ')}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-mono">
                                                        {series.count}
                                                    </span>
                                                    {series.isCompleted && (
                                                        <span className="text-amber-500" title="Completed">🏆</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-stone-100 bg-stone-50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string, value: any }) {
    if (!value) return null;
    return (
        <div className="border border-stone-200 p-3 rounded-lg">
            <div className="text-xs text-stone-400 font-bold uppercase mb-1">{label}</div>
            <div className="font-medium text-stone-800">{String(value)}</div>
        </div>
    );
}
