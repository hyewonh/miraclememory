import { useState, useEffect } from "react";
import { UserProfile } from "@/types";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface SubscriptionManagerProps {
    profile: UserProfile;
}

export function SubscriptionManager({ profile }: SubscriptionManagerProps) {
    const { user } = useAuth();
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    // Use local status state so we can update it from PayPal sync without page reload
    const [effectiveStatus, setEffectiveStatus] = useState(profile.subscriptionStatus);

    if (!profile.isPremium) return null;

    // On mount: sync from PayPal if we have a subscriptionId
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (!profile.subscriptionId || !user) return;
        // Only sync if Firestore shows active (might be stale after a manual PayPal cancel)
        if (profile.subscriptionStatus === 'canceled') return;

        fetch("/api/paypal/subscription-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscriptionId: profile.subscriptionId }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'canceled' && profile.subscriptionStatus !== 'canceled') {
                    // PayPal says cancelled but Firestore is stale — sync it
                    setEffectiveStatus('canceled');
                    updateDoc(doc(db, "users", user.uid), { subscriptionStatus: 'canceled' }).catch(console.error);
                }
            })
            .catch(() => { /* silent fail — don't disrupt UI */ });
    }, [profile.subscriptionId]);

    // Calculate trial details
    const trialStart = profile.trialStartDate ? new Date(profile.trialStartDate) : null;
    const today = new Date();
    let daysLeft = 0;
    let isTrialActive = false;

    if (trialStart) {
        const diffTime = Math.abs(today.getTime() - trialStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysLeft = 7 - diffDays;
        isTrialActive = daysLeft >= 0;
    }

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {/* Header / Accordion Trigger */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
            >
                <h2 className="text-xl font-serif font-bold text-stone-900">
                    Subscription
                </h2>
                <div className="text-stone-400">
                    {isExpanded ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 fade-in duration-200">
                    {effectiveStatus === 'canceled' ? (
                        <div className="space-y-2">
                            <p className="text-stone-500 font-bold text-sm">Subscription Canceled</p>
                            <p className="text-sm text-stone-400">
                                Your access remains active until the end of your current billing period.
                            </p>
                        </div>
                    ) : (
                        <>
                            {isTrialActive && (
                                <div className="mb-4 text-sm text-stone-500">
                                    Trial ends in <span className="font-bold text-amber-600">{daysLeft} days</span>
                                </div>
                            )}
                            <div className="pt-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCancelModalOpen(true);
                                    }}
                                    className="text-stone-400 hover:text-red-600 underline decoration-stone-300 hover:decoration-red-200 transition-all font-medium text-sm"
                                >
                                    Cancel Subscription
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <CancelSubscriptionModal
                isOpen={isCancelModalOpen}
                onClose={() => {
                    setIsCancelModalOpen(false);
                    setEffectiveStatus('canceled'); // Update local state immediately after cancel
                }}
                profile={profile}
            />
        </div>
    );
}
