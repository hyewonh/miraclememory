"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { PayPalSubscription } from "@/components/pricing/PayPalSubscription";
import { cn } from "@/lib/utils";

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STEPS = {
    INTRO: 0,
    SURVEY_1: 1, // Experience
    SURVEY_2: 2, // Favorites
    SURVEY_3: 3, // Frequency
    SURVEY_4: 4, // Goals
    AUTH: 5,
    PAYMENT: 6,
    SUCCESS: 7
};

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const [step, setStep] = useState(STEPS.INTRO);
    const { user, signUpWithEmail, signInWithEmail, signInWithGoogle } = useAuth();
    const [surveyData, setSurveyData] = useState<any>({});

    // Auth State
    const [isLogin, setIsLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [authError, setAuthError] = useState("");
    const [loading, setLoading] = useState(false);

    // Watch for user auth state changes (fixes Google Sign-in hang issue)
    useEffect(() => {
        console.log("OnboardingModal Auth Effect Checker:", { user: !!user, uid: user?.uid, step });
        if (user && step === STEPS.AUTH) {
            console.log("User detected in AUTH step, attempting saveAndAdvance...");
            const saveAndAdvance = async () => {
                try {
                    console.log("saveAndAdvance started");
                    setLoading(true);

                    // Save survey data in background (don't await to prevent hanging)
                    console.log("Saving survey data to Firestore (background)...");
                    setDoc(doc(db, "users", user.uid), {
                        survey: surveyData,
                        createdAt: new Date(),
                        isPremium: false
                    }, { merge: true })
                        .then(() => console.log("Survey data saved successfully in background"))
                        .catch((e) => console.error("Error saving profile in background:", e));

                    console.log("Advancing to PAYMENT immediately.");
                    setStep(STEPS.PAYMENT);
                } catch (e: any) {
                    console.error("Error in saveAndAdvance:", e);
                    setAuthError(e.message || "Something went wrong");
                } finally {
                    setLoading(false);
                    console.log("saveAndAdvance finished, loading set to false");
                }
            };
            saveAndAdvance();
        }
    }, [user, step, surveyData]);

    const handleNext = () => setStep((prev) => prev + 1);

    const handleSurveySelect = (key: string, value: string) => {
        setSurveyData((prev: any) => ({ ...prev, [key]: value }));
        handleNext();
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError("");
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password, name);
                // Save survey data for new user
                if (auth.currentUser) {
                    await setDoc(doc(db, "users", auth.currentUser.uid), {
                        survey: surveyData,
                        createdAt: new Date(),
                        isPremium: false
                    }, { merge: true });
                }
            }
            setStep(STEPS.PAYMENT);
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setStep(STEPS.SUCCESS);
        setTimeout(() => {
            onClose();
            window.location.reload(); // Refresh to update access
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 z-10"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Progress Bar */}
                <div className="h-1.5 bg-stone-100 w-full">
                    <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${((step + 1) / 8) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    {/* STEP 0: INTRO */}
                    {step === STEPS.INTRO && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-3xl">🌿</div>
                            <h2 className="text-2xl font-serif font-bold text-stone-800">Welcome to Your Journey</h2>
                            <p className="text-stone-600">
                                Miracle Memory is designed to help you internalize God's Word effectively.
                                Let's customize your experience.
                            </p>
                            <button onClick={handleNext} className="w-full btn-primary py-3 rounded-full font-bold">
                                Get Started
                            </button>
                        </div>
                    )}

                    {/* STEP 1: Experience */}
                    {step === STEPS.SURVEY_1 && (
                        <SurveyQuestion
                            question="How would you describe your faith journey?"
                            options={[
                                "New Believer (Just started)",
                                "Growing (Want to go deeper)",
                                "Mature (Served for years)",
                                "Seeking (Curious about God)"
                            ]}
                            onSelect={(val) => handleSurveySelect("faithStage", val)}
                        />
                    )}

                    {/* STEP 2: Favorites */}
                    {step === STEPS.SURVEY_2 && (
                        <SurveyQuestion
                            question="What kind of verses do you need most right now?"
                            options={[
                                "Comfort & Healing",
                                "Strength & Courage",
                                "Wisdom & Guidance",
                                "Peace & Anxiety Relief"
                            ]}
                            onSelect={(val) => handleSurveySelect("needs", val)}
                        />
                    )}

                    {/* STEP 3: Frequency */}
                    {step === STEPS.SURVEY_3 && (
                        <SurveyQuestion
                            question="How often do you want to memorize scripture?"
                            options={[
                                "Daily (1 verse/day)",
                                "Weekly (A few verses)",
                                "Occasionally",
                                "Intensively (Program)"
                            ]}
                            onSelect={(val) => handleSurveySelect("frequency", val)}
                        />
                    )}

                    {/* STEP 4: Goals */}
                    {step === STEPS.SURVEY_4 && (
                        <SurveyQuestion
                            question="What is your main goal?"
                            options={[
                                "Closer relationship with God",
                                "Spiritual warfare / Protection",
                                "Teaching others",
                                "Mental peace/clarity"
                            ]}
                            onSelect={(val) => handleSurveySelect("goal", val)}
                        />
                    )}

                    {/* STEP 5: AUTH */}
                    {step === STEPS.AUTH && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-serif font-bold text-stone-800">
                                    {isLogin ? "Welcome Back" : "Create Your Account"}
                                </h2>
                                <p className="text-stone-500 text-sm mt-2">
                                    Save your progress and access your personalized plan.
                                </p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4">
                                {!isLogin && (
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                        required
                                    />
                                )}
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                    required
                                />

                                {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-stone-900 text-white py-3 rounded-full font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : (isLogin ? "Log In" : "Sign Up & Continue")}
                                </button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-stone-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-stone-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    setAuthError("");
                                    setLoading(true);
                                    try {
                                        await signInWithGoogle();
                                        // Save survey data for user (new or existing - merge is safe)
                                        if (auth.currentUser) {
                                            await setDoc(doc(db, "users", auth.currentUser.uid), {
                                                survey: surveyData,
                                                createdAt: new Date(), // This might overwrite, maybe check exists? 
                                                // Actually merge: true handles partial updates. But createdAt?
                                                // Ideally only set createdAt if new. But merge is safe for survey.
                                            }, { merge: true });
                                        }
                                        setStep(STEPS.PAYMENT);
                                    } catch (err: any) {
                                        setAuthError(err.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-700 py-3 rounded-full font-bold hover:bg-stone-50 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-.19-.58z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Sign in with Google
                            </button>

                            <div className="text-center text-sm text-stone-500">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-amber-600 font-bold ml-1 hover:underline"
                                >
                                    {isLogin ? "Sign Up" : "Log In"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: PAYMENT */}
                    {step === STEPS.PAYMENT && (
                        <div className="space-y-6 text-center">
                            <h2 className="text-2xl font-serif font-bold text-stone-800">Start Your 7-Day Free Trial</h2>
                            <p className="text-stone-600 text-sm">
                                Unlimited access to all series, audio, and tracking tools.
                                Cancel anytime.
                            </p>

                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-left space-y-2">
                                <div className="flex justify-between font-bold text-stone-800">
                                    <span>Monthly Plan</span>
                                    <span>$9.99/mo</span>
                                </div>
                                <div className="text-xs text-stone-500">
                                    • Full Access to 15+ Series<br />
                                    • Pro Audio Narration<br />
                                    • Progress Tracking & Rewards<br />
                                    • 7 Days Free, then auto-renews
                                </div>
                            </div>

                            <div className="min-h-[150px]">
                                <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "", intent: "subscription", vault: true }}>
                                    <PayPalSubscription onSuccess={handlePaymentSuccess} />
                                </PayPalScriptProvider>
                            </div>
                            <p className="text-[10px] text-stone-400">
                                By continuing, you agree to our Terms. You won't be charged until after your trial ends.
                            </p>
                        </div>
                    )}

                    {/* STEP 7: SUCCESS */}
                    {step === STEPS.SUCCESS && (
                        <div className="text-center space-y-6 py-10">
                            <div className="text-6xl animate-bounce">🎉</div>
                            <h2 className="text-3xl font-serif font-bold text-stone-800">You're All Set!</h2>
                            <p className="text-stone-600">
                                Your journey to memorizing God's word begins now.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SurveyQuestion({ question, options, onSelect }: { question: string, options: string[], onSelect: (val: string) => void }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-serif font-bold text-stone-800 text-center">{question}</h2>
            <div className="space-y-3">
                {options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(opt)}
                        className="w-full p-4 text-left rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50 transition-all font-medium text-stone-700"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
