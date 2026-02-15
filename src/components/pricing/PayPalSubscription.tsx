"use client";

import { useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// Replace with your actual Plan ID from PayPal Developer Dashboard
interface PayPalSubscriptionProps {
    planId: string;
    onSuccess: (subscriptionID: string) => void;
}

export function PayPalSubscription({ planId, onSuccess }: PayPalSubscriptionProps) {
    const { user } = useAuth();
    const [{ options, isPending, isRejected }, dispatch] = usePayPalScriptReducer();

    useEffect(() => {
        dispatch({
            type: "resetOptions",
            value: {
                ...options,
                intent: "subscription",
                vault: true,
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
            },
        } as any);
    }, [dispatch]);

    if (!user) return null;

    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
        return (
            <div className="text-center p-4 text-red-500 bg-red-50 rounded-xl border border-red-100">
                <p className="font-bold text-sm">PayPal Configuration Error</p>
                <p className="text-xs mt-1">Missing Client ID in environment variables.</p>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="text-center p-4 text-red-500 bg-red-50 rounded-xl border border-red-100">
                <p className="font-bold text-sm">Failed to load PayPal</p>
                <p className="text-xs mt-1">Please refresh the page and try again.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto relative min-h-[120px]">
            {isPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-stone-500 font-medium">Loading...</span>
                </div>
            )}

            <div className="scale-95 origin-top">
                <PayPalButtons
                    style={{
                        shape: "rect",
                        color: "gold",
                        layout: "vertical",
                        label: "subscribe"
                    }}
                    createSubscription={(data, actions) => {
                        return actions.subscription.create({
                            plan_id: planId
                        });
                    }}
                    onApprove={async (data, actions) => {
                        console.log("Subscription approved:", data);
                        if (data.subscriptionID) {
                            await updateDoc(doc(db, "users", user.uid), {
                                isPremium: true,
                                subscriptionStatus: 'active',
                                subscriptionId: data.subscriptionID,
                                trialStartDate: new Date()
                            });
                            onSuccess(data.subscriptionID);
                        }
                    }}
                    onError={(err) => {
                        console.error("PayPal Error:", err);
                        alert("Payment failed / Canceled. Please try again.");
                    }}
                />
            </div>
        </div>
    );
}

