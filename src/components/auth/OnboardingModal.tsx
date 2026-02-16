"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { PayPalSubscription } from "@/components/pricing/PayPalSubscription";
import { cn } from "@/lib/utils";

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    startAtPayment?: boolean;
}

const STEPS = {
    INTRO: 0,
    DEMOGRAPHICS: 1, // Age & Location
    SURVEY_1: 2, // Experience
    SURVEY_2: 3, // Favorites
    SURVEY_3: 4, // Frequency
    SURVEY_4: 5, // Goals
    AUTH: 6,
    PAYMENT: 7,
    SUCCESS: 8
};

// ---------------------------------------------------------
// REPLACE THESE WITH YOUR SANDBOX PLAN IDS FROM PAYPAL
// Follow the guide in `paypal_setup.md`
// ---------------------------------------------------------
const PAYPAL_PLANS = {
    MONTHLY: "P-3EK676302W2441939NGJJGCQ",
    YEARLY: "P-2KU86670VG943341SNGJJIAY"
};

export function OnboardingModal({ isOpen, onClose, startAtPayment = false }: OnboardingModalProps) {
    const [step, setStep] = useState(STEPS.INTRO);
    const { user, signUpWithEmail, signInWithEmail, signInWithGoogle } = useAuth();
    const [surveyData, setSurveyData] = useState<any>({});

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            if (startAtPayment) {
                setStep(STEPS.PAYMENT);
            } else {
                setStep(STEPS.INTRO);
            }
        }
    }, [isOpen, startAtPayment]);

    // Prevent closing if in critical steps
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (step === STEPS.AUTH) {
            return; // Lock modal only during Auth
        }
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Auth State
    const [isLogin, setIsLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [authError, setAuthError] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

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

    const handlePaymentSuccess = (subscriptionID?: string) => {
        setStep(STEPS.SUCCESS);
        setTimeout(() => {
            onClose();
            window.location.reload(); // Refresh to update access
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">

                {/* Close Button (Hidden during Auth to minimize drop-off) */}
                {step !== STEPS.AUTH && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 z-10"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}

                {/* Progress Bar */}
                <div className="h-1.5 bg-stone-100 w-full shrink-0">
                    <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${((step + 1) / 8) * 100}%` }}
                    />
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar">
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

                    {/* STEP 1: Demographics (New) */}
                    {step === STEPS.DEMOGRAPHICS && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h2 className="text-xl font-serif font-bold text-stone-800">Tell us a bit about yourself</h2>
                                <p className="text-stone-500 text-sm mt-1">This helps us personalize your experience.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Age Range</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        onChange={(e) => setSurveyData({ ...surveyData, age: e.target.value })}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select your age</option>
                                        <option value="18-24">18-24</option>
                                        <option value="25-34">25-34</option>
                                        <option value="35-44">35-44</option>
                                        <option value="45-54">45-54</option>
                                        <option value="55-64">55-64</option>
                                        <option value="65+">65+</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Region</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        onChange={(e) => setSurveyData({ ...surveyData, location: e.target.value })}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select your region</option>
                                        <option value="North America">North America</option>
                                        <option value="Europe">Europe</option>
                                        <option value="Asia">Asia</option>
                                        <option value="South America">South America</option>
                                        <option value="Africa">Africa</option>
                                        <option value="Oceania">Oceania</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!surveyData.age || !surveyData.location}
                                className="w-full btn-primary py-3 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Experience */}
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
                                <div className="space-y-2">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className={cn(
                                            "w-full px-4 py-3 rounded-xl border outline-none transition-all",
                                            authError ? "border-red-300 focus:ring-red-200" : "border-stone-200 focus:ring-2 focus:ring-amber-500"
                                        )}
                                        required
                                    />
                                    {/* Password Requirements Checklist (Only for Signup) */}
                                    {!isLogin && (
                                        <div className="text-xs space-y-1 pl-1">
                                            {[
                                                { label: "At least 6 characters", valid: password.length >= 6 },
                                                { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
                                                { label: "One number", valid: /[0-9]/.test(password) },
                                                { label: "One special char (!@#$)", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
                                            ].map((req, idx) => (
                                                <div key={idx} className={cn("flex items-center gap-2 transition-colors duration-200", req.valid ? "text-emerald-600" : "text-stone-400")}>
                                                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center border", req.valid ? "bg-emerald-100 border-emerald-200" : "bg-stone-100 border-stone-200")}>
                                                        {req.valid && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                    <span>{req.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {authError && (
                                    <div className="text-center space-y-2">
                                        <p className="text-red-500 text-sm">{authError}</p>
                                        {/* If email already exists, offer login option */}
                                        {authError.includes("email-already-in-use") && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsLogin(true);
                                                    setAuthError("");
                                                }}
                                                className="text-amber-600 font-bold text-sm hover:underline"
                                            >
                                                Log in with this email instead?
                                            </button>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || (!isLogin && !(
                                        password.length >= 6 &&
                                        /[A-Z]/.test(password) &&
                                        /[0-9]/.test(password) &&
                                        /[!@#$%^&*(),.?":{}|<>]/.test(password)
                                    ))}
                                    className="w-full bg-stone-900 text-white py-3 rounded-full font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        const timeoutPromise = new Promise((_, reject) => {
                                            setTimeout(() => reject(new Error("Google Sign-In timed out. Please try again.")), 15000);
                                        });

                                        await Promise.race([
                                            signInWithGoogle(),
                                            timeoutPromise
                                        ]);

                                        // Save survey data for user (new or existing - merge is safe)
                                        if (auth.currentUser) {
                                            await setDoc(doc(db, "users", auth.currentUser.uid), {
                                                survey: surveyData,
                                                createdAt: new Date(),
                                                isPremium: false
                                            }, { merge: true });
                                        }
                                        setStep(STEPS.PAYMENT);
                                    } catch (err: any) {
                                        console.error("Onboarding Google Sign-In Error:", err);
                                        setAuthError(err.message);
                                        if (err.code === 'auth/popup-blocked') {
                                            alert("Popup blocked. Please allow popups for this site.");
                                        }
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

                            {/* Login Link Removed as per request */}
                        </div>
                    )}

                    {/* STEP 6: PAYMENT */}
                    {step === STEPS.PAYMENT && (
                        <div className="space-y-6 text-center">
                            <h2 className="text-2xl font-serif font-bold text-stone-800">Start Your 7-Day Free Trial</h2>
                            <p className="text-stone-600 text-lg leading-relaxed">
                                Unlimited access to all series, audio, and tracking tools.
                                <br />
                                <span className="text-sm text-stone-500 block mt-1">Cancel anytime.</span>
                            </p>

                            <div className="space-y-4">
                                {/* Monthly Plan */}
                                <div
                                    onClick={() => setSelectedPlan('monthly')}
                                    className={cn(
                                        "p-6 rounded-2xl border-2 shadow-sm relative overflow-hidden cursor-pointer transition-all text-left",
                                        selectedPlan === 'monthly'
                                            ? "bg-white border-amber-400 ring-1 ring-amber-100"
                                            : "bg-white border-stone-200 opacity-70 hover:opacity-100 hover:border-amber-200"
                                    )}
                                >
                                    <div className="absolute top-0 right-0 bg-stone-100 text-stone-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                        7 Days Free
                                    </div>
                                    <h3 className="text-lg font-serif font-bold text-stone-800 mb-1">Kingdom Partner</h3>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-3xl font-bold text-stone-900">$7.99</span>
                                        <span className="text-stone-500 font-medium">/mo</span>
                                    </div>
                                    <p className="text-stone-500 text-sm mb-4 flex items-center gap-2">
                                        Price of a meal 🍱
                                    </p>

                                    <ul className="space-y-2 text-sm text-stone-600">
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>Access to All Series</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>Unlimited Voice Recording</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Yearly Plan */}
                                <div
                                    onClick={() => setSelectedPlan('yearly')}
                                    className={cn(
                                        "p-6 rounded-2xl border-2 shadow-md relative overflow-hidden cursor-pointer transition-all text-left",
                                        selectedPlan === 'yearly'
                                            ? "bg-amber-50 border-amber-500 ring-1 ring-amber-200 scale-[1.02]"
                                            : "bg-white border-stone-200 opacity-80 hover:opacity-100 hover:border-amber-300"
                                    )}
                                >
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                        Best Value • 50% OFF
                                    </div>
                                    <h3 className="text-lg font-serif font-bold text-stone-800 mb-1">Yearly Plan</h3>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-3xl font-bold text-stone-900">$47.97</span>
                                        <span className="text-stone-500 font-medium">/year</span>
                                        <span className="text-stone-400 text-sm line-through decoration-stone-400 ml-2">$95.88</span>
                                    </div>
                                    <p className="text-emerald-700 font-bold text-sm mb-4">
                                        One-time payment. Save 50% instantly!
                                    </p>

                                    <ul className="space-y-2 text-sm text-stone-600">
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>Full Access for 12 Months</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>Supports Elim Center Int'l</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>



                            <div className="mt-8 pt-6 border-t border-stone-100">
                                <div className="mb-4 text-sm text-stone-500 font-medium uppercase tracking-wide">
                                    Step 2: Secure Payment via PayPal
                                </div>
                                <div className="min-h-[150px] relative z-0">
                                    <PayPalSubscription
                                        planId={selectedPlan === 'monthly' ? PAYPAL_PLANS.MONTHLY : PAYPAL_PLANS.YEARLY}
                                        onSuccess={(subId) => handlePaymentSuccess(subId)}
                                    />
                                </div>
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
    const [selected, setSelected] = useState<string | null>(null);

    // Reset selection when question changes (new step)
    useEffect(() => {
        setSelected(null);
    }, [question]);

    const handleSelect = (opt: string) => {
        setSelected(opt);
        // Short delay to allow animation/feedback to be seen
        setTimeout(() => {
            onSelect(opt);
        }, 300);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-serif font-bold text-stone-800 text-center">{question}</h2>
            <div className="space-y-3">
                {options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSelect(opt)}
                        className={cn(
                            "w-full p-4 text-left rounded-xl border transition-all font-medium duration-200 active:scale-[0.98]",
                            selected === opt
                                ? "bg-amber-500 border-amber-500 text-white shadow-md"
                                : "border-stone-200 bg-white text-stone-700 hover:border-amber-400 hover:bg-amber-50"
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
