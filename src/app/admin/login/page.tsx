"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (id === "swan" && password === "1234") {
            // Set cookie for 1 day
            const expires = new Date();
            expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
            document.cookie = `miracle_admin_token=true;expires=${expires.toUTCString()};path=/`;

            // Redirect to admin dashboard
            router.push("/admin");
        } else {
            setError("Invalid ID or Password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 w-full max-w-sm">
                <div className="text-center mb-8">
                    <span className="text-4xl">👑</span>
                    <h1 className="text-2xl font-serif font-bold text-stone-900 mt-4">Admin Access</h1>
                    <p className="text-stone-500 text-sm">Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">ID</label>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Enter ID"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Enter Password"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-stone-900 text-white py-3 rounded-lg font-bold hover:bg-stone-800 transition-colors"
                    >
                        Login
                    </button>
                </form>

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
