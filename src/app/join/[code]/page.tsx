"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AmbassadorLandingPage() {
    const params = useParams();
    const code = params.code as string;
    const router = useRouter();
    const { user } = useAuth();
    const [ambassadorName, setAmbassadorName] = useState<string | null>(null);

    useEffect(() => {
        // Store referral code in sessionStorage to apply after signup
        if (code) sessionStorage.setItem("referralCode", code);

        // Look up ambassador name
        const load = async () => {
            const refDoc = await getDoc(doc(db, "referrals", code));
            if (refDoc.exists()) {
                const ownerSnap = await getDoc(doc(db, "users", refDoc.data().ownerUid));
                if (ownerSnap.exists()) {
                    setAmbassadorName(ownerSnap.data().displayName ?? null);
                }
            }
        };
        load();
    }, [code]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-sm font-bold">
                    🏆 Ambassador 초대
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-stone-900">
                        {ambassadorName
                            ? `${ambassadorName} 님이 초대했습니다`
                            : "Miracle Memory에 초대받으셨습니다"}
                    </h1>
                    <p className="text-stone-500 mt-2 text-sm leading-relaxed">
                        하나님의 말씀을 6개 언어로 암송하는<br />성경 암송 앱입니다.
                    </p>
                </div>

                {/* Benefits */}
                <div className="bg-rose-50 rounded-2xl p-4 text-left space-y-2">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">초대 특전</p>
                    {[
                        "📖 6개 언어 성경 구절 암송",
                        "🎵 전문 성우 낭독 오디오",
                        "📊 암기 진도 대시보드",
                        "🎁 가입 즉시 모든 기능 체험",
                    ].map(b => (
                        <p key={b} className="text-sm text-stone-700">{b}</p>
                    ))}
                </div>

                <button
                    onClick={() => router.push(`/?ref=${code}`)}
                    className="w-full h-14 rounded-2xl bg-rose-500 text-white font-bold text-lg hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                >
                    지금 시작하기 →
                </button>

                <p className="text-xs text-stone-400">
                    초대 코드: <span className="font-mono font-bold">{code}</span>
                </p>
            </div>
        </main>
    );
}
