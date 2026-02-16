import { UserProfile } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SubscriptionManagerProps {
    profile: UserProfile;
}

export function SubscriptionManager({ profile }: SubscriptionManagerProps) {
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
        <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                        Subscription
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            {profile.subscriptionStatus === 'active' ? 'Active' : 'Premium'}
                        </span>
                    </h2>
                    {isTrialActive && (
                        <p className="text-stone-500 text-sm mt-1">
                            Trial ends in <span className="font-bold text-amber-600">{daysLeft} days</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 text-sm space-y-3">
                <div className="flex justify-between items-center text-stone-600">
                    <span>Plan</span>
                    <span className="font-bold text-stone-900">Kingdom Partner</span>
                </div>
                {profile.subscriptionId && (
                    <div className="flex justify-between items-center text-stone-600">
                        <span>Subscription ID</span>
                        <span className="font-mono text-xs">{profile.subscriptionId}</span>
                    </div>
                )}
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-4">
                <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm leading-relaxed border border-red-100">
                    <strong>Cancellation Policy:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1 opacity-90">
                        <li>Cancel <strong>before your 7-day trial ends</strong> to avoid being charged.</li>
                        <li>Payments made after the 7-day trial are <strong>non-refundable</strong>.</li>
                    </ul>
                </div>

                <a
                    href="https://www.paypal.com/myaccount/autopay/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 rounded-xl border border-stone-300 text-stone-600 font-bold hover:bg-stone-50 hover:text-stone-900 transition-colors flex items-center justify-center gap-2"
                >
                    Manage / Cancel on PayPal
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
            </div>
        </div>
    );
}
