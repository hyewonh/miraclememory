"use client";

import { useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// Replace with your actual Plan ID from PayPal Developer Dashboard
const PLAN_ID = "P-3N9395171L295964MM7ZL5YQ"; // Placeholder, user might need to provide this.

interface PayPalSubscriptionProps {
    onSuccess: () => void;
}

export function PayPalSubscription({ onSuccess }: PayPalSubscriptionProps) {
    const { user } = useAuth();
    const [{ options, isPending }, dispatch] = usePayPalScriptReducer();

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
    }, [dispatch]); // eslint-disable-next-line react-hooks/exhaustive-deps

    if (!user) return null;

    return (
        <div className="w-full max-w-md mx-auto">
            {isPending && <div className="spinner" />}
            <PayPalButtons
                style={{
                    shape: "rect",
                    color: "gold",
                    layout: "vertical",
                    label: "subscribe"
                }}
                createSubscription={(data, actions) => {
                    return actions.subscription.create({
                        plan_id: PLAN_ID
                    });
                }}
                onApprove={async (data, actions) => {
                    // Capture subscription details
                    console.log("Subscription approved:", data);

                    if (data.subscriptionID) {
                        // Update user profile
                        await updateDoc(doc(db, "users", user.uid), {
                            isPremium: true,
                            subscriptionStatus: 'active',
                            subscriptionId: data.subscriptionID,
                            trialStartDate: new Date()
                        });
                        onSuccess();
                    }
                }}
            />
        </div>
    );
}
