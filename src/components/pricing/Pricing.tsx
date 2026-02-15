"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function Pricing() {
    const { user, signInWithGoogle } = useAuth();
    const [subscribed, setSubscribed] = useState(false);

    // PRE-DEFINED PLAN ID (Start with Trial + $4.99)
    const PLAN_ID = "P-93K30107FK2437318NGIP2VQ";

    return (
        <section className="py-24 bg-stone-50" id="pricing">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-4">
                    Support the Ministry
                </h2>
                <p className="text-stone-600 mb-12 max-w-xl mx-auto">
                    Start with a <strong>7-Day Free Trial</strong>. Afterward, a small monthly donation supports Elim Center International.
                </p>

                <div className="bg-white p-8 rounded-2xl shadow-xl border border-amber-500/20 max-w-md mx-auto relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        7 DAYS FREE
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-stone-800 mb-2">Kingdom Partner</h3>
                    <div className="text-5xl font-bold text-stone-900 mb-2">$7.99<span className="text-lg text-stone-400 font-normal">/mo</span></div>
                    <p className="text-stone-500 text-sm mb-8">Price of a meal 🍱</p>

                    <ul className="text-left space-y-4 mb-8 text-stone-600">
                        <li className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Access to All Series
                        </li>
                        <li className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Unlimited Voice Recording
                        </li>
                        <li className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Supports Elim Center International
                        </li>
                    </ul>

                    {subscribed ? (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl font-medium border border-green-200">
                            Welcome to the family!
                        </div>
                    ) : (
                        <>
                            {user ? (
                                <div className="relative z-0">
                                    <PayPalButtons
                                        style={{ shape: "pill", color: "gold", layout: "vertical", label: "subscribe" }}
                                        createSubscription={(data, actions) => {
                                            return actions.subscription.create({
                                                plan_id: PLAN_ID
                                            });
                                        }}
                                        onApprove={async (data, actions) => {
                                            console.log("Subscription completed:", data);
                                            setSubscribed(true);
                                            alert("Thank you for your donation! Your trial has started.");
                                        }}
                                    />
                                    <p className="text-xs text-stone-400 mt-4">
                                        First 7 days are free. Cancel anytime before then to avoid charge.
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => signInWithGoogle()}
                                    className="w-full bg-stone-900 text-white py-4 rounded-full font-bold hover:opacity-90 transition-opacity"
                                >
                                    Sign In to Start Trial
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
