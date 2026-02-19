"use client";

import { useState } from "react";
import { UserProfile } from "@/types";

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
}

type Step = 'survey' | 'confirm' | 'final';

export function CancelSubscriptionModal({ isOpen, onClose, profile }: CancelSubscriptionModalProps) {
    const [step, setStep] = useState<Step>('survey');
    const [reason, setReason] = useState("");

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

    const handleConfirmCancel = () => {
        setStep('final');
        // Here we could update Firestore to log the reason and status 'cancellation_pending'
        console.log("User cancelling because:", reason);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h3 className="font-bold text-stone-800 text-lg">
                        {step === 'survey' && "We're sorry to see you go"}
                        {step === 'confirm' && "Are you sure?"}
                        {step === 'final' && "Subscription Cancellation"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
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
                                    I still want to cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'final' && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-stone-900 mb-2">Final Step</h4>
                                <p className="text-stone-600">
                                    To stop future charges, you must cancel your recurring payment directly on PayPal.
                                </p>
                                <p className="text-sm text-stone-500 mt-2">
                                    Your access will remain active until the end of your billing period.
                                </p>
                            </div>
                            <a
                                href="https://www.paypal.com/myaccount/autopay/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={onClose}
                                className="block w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
                            >
                                Go to PayPal to Cancel
                            </a>
                            <button
                                onClick={onClose}
                                className="w-full text-stone-500 py-3 font-medium hover:text-stone-900 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
