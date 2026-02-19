import { useState } from "react";
import { UserProfile } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";

interface SubscriptionManagerProps {
    profile: UserProfile;
}

export function SubscriptionManager({ profile }: SubscriptionManagerProps) {
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    if (!profile.isPremium) return null;

    // Calculate trial details
    const trialStart = profile.trialStartDate ? new Date(profile.trialStartDate) : null;
    const today = new Date();

    // Check if within 7 days
    let daysLeft = 0;
    let isTrialActive = false;

    if (trialStart) {
        const diffTime = Math.abs(today.getTime() - trialStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Logic: if start was today, diff is ~0. If start was yesterday, diff is 1.
        // Trial is 7 days.
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

            {/* Trial Info (Always Visible if active?) - User said "Initially invisible", but trial info is critical. 
                Let's put trial info IN the header if it's important, or inside. 
                User said "Content of the second box... initially hidden". 
                I'll put everything else inside.
            */}

            {isExpanded && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 fade-in duration-200">
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
                </div>
            )}

            <CancelSubscriptionModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                profile={profile}
            />
        </div>
    );
}
