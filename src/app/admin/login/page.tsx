"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [error, setError] = useState("");

    // If already logged in, redirect to admin dashboard
    useEffect(() => {
        if (user) {
            router.push("/admin");
        }
    }, [user, router]);

    const handleGoogleLogin = async () => {
        setError("");
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);
            console.log("Logged in:", result.user.email);
            // Redirection is handled by the useEffect
        } catch (error: any) {
            console.error("Login failed detailed error:", error);
            if (error.code === 'auth/unauthorized-domain') {
                setError(`Domain Not Authorized: Please add this domain to Firebase Console. (${window.location.hostname})`);
            } else if (error.code === 'auth/popup-blocked') {
                setError("Popup Blocked: Please enable popups for this site.");
            } else {
                setError("Failed to sign in: " + (error.message || "Unknown error"));
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 w-full max-w-sm text-center">
                <div className="mb-8">
                    <span className="text-4xl">👑</span>
                    <h1 className="text-2xl font-serif font-bold text-stone-900 mt-4">Admin Access</h1>
                    <p className="text-stone-500 text-sm">Sign in with an authorized Google account</p>
                </div>

                {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-stone-900 text-white py-3 rounded-lg font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                    Sign in with Google
                </button>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push("/")}
                        className="text-stone-400 hover:text-stone-600 text-sm underline"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
}
