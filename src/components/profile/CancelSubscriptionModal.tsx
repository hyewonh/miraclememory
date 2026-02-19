"use client";

import { useState } from "react";
import { UserProfile } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
}

type Step = 'survey' | 'confirm' | 'canceling' | 'final';

export function CancelSubscriptionModal({ isOpen, onClose, profile }: CancelSubscriptionModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<Step>('survey');
    const [reason, setReason] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    if (!isOpen) return null;

    const reasons = [
        "Too expensive",
        "Not using it enough",
        "Found a better alternative",
        "Technical issues",
        "Other"
    ];

    const handleSurveySubmit = () => {
        if (!reason) return;
        setStep('confirm');
    };

    const handleConfirmCancel = async () => {
        if (!user || !profile.subscriptionId) {
            setErrorMsg("No active subscription ID found.");
            return;
        }

        setStep('canceling');
        setErrorMsg("");

        try {
            // Call API backend to cancel subscription directly on PayPal
            const res = await fetch("/api/paypal/cancel-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscriptionId: profile.subscriptionId,
                    reason: reason
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to cancel subscription.");
            }

            // Update user status
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                subscriptionStatus: 'canceled'
            });

            setStep('final');

        } catch (error: any) {
            console.error("Cancelation error:", error);
            setErrorMsg(error.message || "An unexpected error occurred. Please try again.");
            setStep('confirm'); // Revert back to confirm screen to show error
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h3 className="font-bold text-stone-800 text-lg">
                        {step === 'survey' && "We're sorry to see you go"}
                        {step === 'confirm' && "Are you sure?"}
                        {step === 'canceling' && "Canceling Subscription..."}
                        {step === 'final' && "Subscription Canceled"}
                    </h3>
                    {step !== 'canceling' && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'survey' && (
                        <div className="space-y-4">
                            <p className="text-stone-600">Please tell us why you are leaving so we can improve.</p>
                            <div className="space-y-2">
                                {reasons.map((r) => (
                                    <label key={r} className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="cancel-reason"
                                            value={r}
                                            checked={reason === r}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-4 h-4 text-stone-900 border-stone-300 focus:ring-stone-900"
                                        />
                                        <span className="text-stone-700">{r}</span>
                                    </label>
                                ))}
                            </div>
                            <button
                                onClick={handleSurveySubmit}
                                disabled={!reason}
                                className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                                🥺
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-stone-900 mb-2">Wait! Don't lose your streak!</h4>
                                <p className="text-stone-600 mb-4">
                                    If you cancel now, you will lose access to premium features and your progress tracking history after your current period ends.
                                </p>
                                <div className="bg-stone-50 p-4 rounded-xl text-left border border-stone-100">
                                    <h5 className="font-bold text-stone-800 text-sm mb-2">Kingdom Partner Benefits you'll lose:</h5>
                                    <ul className="text-sm text-stone-600 space-y-1 list-disc pl-4">
                                        <li>Unlimited Audio Recording</li>
                                        <li>Unlimited Verse Access</li>
                                        <li>Detailed Progress Tracking</li>
                                    </ul>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={onClose}
                                    className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
                                >
                                    Keep My Subscription
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    className="w-full text-stone-500 py-3 font-medium hover:text-stone-900 transition-colors"
                                >
                                    Cancel Subscription Now
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'canceling' && (
                        <div className="space-y-6 text-center py-8">
                            <div className="w-16 h-16 mx-auto border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin"></div>
                            <p className="text-stone-600 font-medium">Processing your cancellation securely...</p>
                        </div>
                    )}

                    {step === 'final' && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-stone-900 mb-2">Successfully Canceled</h4>
                                <p className="text-stone-600">
                                    Your recurring payment has been stopped. Your access will remain active until the end of your current billing period.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    window.location.reload();
                                }}
                                className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
