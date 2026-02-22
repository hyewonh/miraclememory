"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCustomSeries, SharedSeries } from "@/hooks/useCustomSeries";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const FREE_VERSE_LIMIT = 4;

export default function SharedSeriesPage() {
    const router = useRouter();
    const params = useParams();
    const shareId = params.shareId as string;

    const { user } = useAuth();
    const { profile } = useProfile();
    const { importSharedSeries } = useCustomSeries();
    const isPremium = profile?.isPremium ?? false;

    const [shared, setShared] = useState<SharedSeries | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);

    useEffect(() => {
        if (!shareId) return;
        getDoc(doc(db, "shared_series", shareId)).then(snap => {
            if (!snap.exists()) { setNotFound(true); }
            else { setShared(snap.data() as SharedSeries); }
            setLoading(false);
        });
    }, [shareId]);

    const handleImport = async () => {
        if (!user) { router.push("/"); return; }
        if (!shared || importing) return;
        setImporting(true);
        await importSharedSeries(shared);
        setImported(true);
        setImporting(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800" />
        </div>
    );

    if (notFound || !shared) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4 px-6 text-center">
            <div className="text-5xl">📭</div>
            <h2 className="text-2xl font-bold text-stone-900">시리즈를 찾을 수 없어요</h2>
            <p className="text-stone-400 text-sm">링크가 만료되었거나 삭제된 시리즈입니다.</p>
            <button onClick={() => router.push("/")} className="mt-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-bold text-sm">
                홈으로
            </button>
        </div>
    );

    const totalVerses = shared.verses.length;

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            <Navbar />

            {/* Hero banner */}
            <div className="bg-gradient-to-br from-amber-50 to-stone-50 border-b border-amber-100 px-6 py-10">
                <div className="max-w-2xl mx-auto text-center">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
                        {shared.ownerName}님이 공유한 시리즈
                    </p>
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">{shared.title}</h1>
                    {shared.description && (
                        <p className="text-stone-500 text-sm mb-4">{shared.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-3 text-sm text-stone-400">
                        <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs">
                            총 {totalVerses}구절
                        </span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

                {/* CTA - Add to my library */}
                {imported ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center flex flex-col items-center gap-3">
                        <div className="text-3xl">✅</div>
                        <p className="font-bold text-emerald-700">내 시리즈에 추가됐어요!</p>
                        <button onClick={() => router.push("/profile")} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-all">
                            프로필에서 확인하기
                        </button>
                    </div>
                ) : (
                    <div className="bg-white border border-stone-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div>
                            <p className="font-bold text-stone-900 text-sm">내 암송 라이브러리에 추가</p>
                            <p className="text-stone-400 text-xs mt-0.5">이 시리즈로 암송 연습을 시작하세요</p>
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-sm flex-shrink-0 disabled:opacity-50"
                        >
                            {importing ? "추가 중..." : user ? "내 시리즈에 추가" : "로그인 후 추가"}
                        </button>
                    </div>
                )}

                {/* Verse list */}
                <div className="space-y-3">
                    <h2 className="font-bold text-stone-700 text-sm">구절 목록</h2>
                    {shared.verses.map((verse, idx) => {
                        const isLocked = !isPremium && idx >= FREE_VERSE_LIMIT;
                        const text = verse.text["ko"] ?? verse.text["en"] ?? Object.values(verse.text)[0] ?? "";
                        const ref = verse.reference["ko"] ?? verse.reference["en"] ?? Object.values(verse.reference)[0] ?? "";
                        return (
                            <div
                                key={verse.id}
                                className={cn(
                                    "bg-white rounded-2xl border p-4 transition-all",
                                    isLocked ? "border-stone-100 opacity-60" : "border-stone-100"
                                )}
                            >
                                <div className="flex gap-3 items-start">
                                    <span className="text-amber-500 font-bold text-sm w-6 flex-shrink-0 mt-0.5">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        {isLocked ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="h-4 bg-stone-100 rounded-full w-full" />
                                                <div className="h-4 bg-stone-100 rounded-full w-3/4" />
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-stone-400">🔒 프리미엄 구독 시 잠금 해제</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-stone-700 text-sm leading-relaxed">{text}</p>
                                                <p className="text-xs text-amber-600 font-bold mt-1">{ref}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Premium CTA if locked verses exist */}
                {!isPremium && totalVerses > FREE_VERSE_LIMIT && (
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white text-center flex flex-col items-center gap-3 shadow-lg">
                        <div className="text-3xl">👑</div>
                        <h3 className="font-bold text-xl">나머지 {totalVerses - FREE_VERSE_LIMIT}구절을 모두 보려면</h3>
                        <p className="text-amber-100 text-sm">프리미엄으로 업그레이드하면 모든 구절 암송이 가능해요</p>
                        <button
                            onClick={() => router.push("/#pricing")}
                            className="bg-white text-amber-600 font-bold px-8 py-3 rounded-xl hover:bg-amber-50 transition-all shadow-md"
                        >
                            프리미엄 시작하기
                        </button>
                    </div>
                )}

                {/* Share again button */}
                <div className="text-center pt-2">
                    <button
                        onClick={() => {
                            const url = window.location.href;
                            navigator.clipboard.writeText(url).then(() => alert("링크가 복사됐어요! 텔레그램으로 공유해보세요 🙌"));
                        }}
                        className="text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2"
                    >
                        링크 다시 복사하기
                    </button>
                </div>
            </main>
        </div>
    );
}
