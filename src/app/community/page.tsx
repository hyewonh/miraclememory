"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCommunityFeed, useReaction, useComments, CommunityPost, ReactionType } from "@/hooks/useCommunity";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useCustomSeries } from "@/hooks/useCustomSeries";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

// ---------- REACTION BUTTON ----------
function ReactionBtn({
    emoji, count, active, onClick
}: { emoji: string; count: number; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                active
                    ? "bg-amber-50 border-amber-300 text-amber-700 scale-105"
                    : "bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-100"
            )}
        >
            <span>{emoji}</span>
            <span className="text-xs">{count}</span>
        </button>
    );
}

// ---------- COMMENT MODAL ----------
function CommentModal({ post, onClose }: { post: CommunityPost; onClose: () => void }) {
    const { user } = useAuth();
    const { comments, loading, addComment } = useComments(post.shareId);
    const [text, setText] = useState("");
    const [posting, setPosting] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const submit = async () => {
        if (!text.trim() || posting) return;
        setPosting(true);
        await addComment(text);
        setText("");
        setPosting(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl flex flex-col max-h-[85vh] rounded-t-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
                    <div>
                        <p className="font-bold text-stone-900 text-sm truncate">{post.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">댓글 {post.commentCount}개</p>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Comments list */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-300" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-10 text-stone-400 text-sm">첫 번째 댓글을 남겨보세요 💬</div>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                    {c.authorName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-stone-800 text-xs">{c.authorName}</span>
                                        <span className="text-stone-300 text-[10px]">
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-600 mt-0.5 break-words">{c.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                {user ? (
                    <div className="border-t border-stone-100 px-4 py-3 flex gap-3 items-end flex-shrink-0">
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value.slice(0, 200))}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                            placeholder="댓글을 입력하세요... (200자)"
                            rows={2}
                            className="flex-1 resize-none text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
                        />
                        <button
                            onClick={submit}
                            disabled={posting || !text.trim()}
                            className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all disabled:opacity-40 flex-shrink-0"
                        >
                            {posting ? "..." : "전송"}
                        </button>
                    </div>
                ) : (
                    <div className="border-t border-stone-100 p-4 text-center">
                        <p className="text-stone-400 text-sm">댓글은 로그인 후 남길 수 있어요</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------- SERIES CARD ----------
function SeriesCard({ post }: { post: CommunityPost }) {
    const { user } = useAuth();
    const { react } = useReaction(post.shareId);
    const { importSharedSeries } = useCustomSeries();
    const [showComments, setShowComments] = useState(false);
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);

    const myReacted = (type: ReactionType) => !!user && post.reactions[type].includes(user.uid);

    const handleReact = async (type: ReactionType) => {
        if (!user) return;
        await react(type, myReacted(type));
    };

    const handleImport = async () => {
        if (!user || importing || imported) return;
        setImporting(true);
        await importSharedSeries(post);
        setImported(true);
        setImporting(false);
    };

    const totalReactions = post.reactions.pray.length + post.reactions.heart.length + post.reactions.thumbs.length;

    return (
        <>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Top gradient accent */}
                <div className="h-1 bg-gradient-to-r from-amber-300 to-amber-500" />

                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-stone-900 leading-tight line-clamp-1">{post.title}</h3>
                            {post.description && (
                                <p className="text-stone-400 text-xs mt-0.5 line-clamp-1">{post.description}</p>
                            )}
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={importing || imported}
                            className={cn(
                                "flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all",
                                imported
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                            )}
                        >
                            {imported ? "✓ 추가됨" : importing ? "..." : "+ 추가"}
                        </button>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {post.ownerName?.[0] ?? "?"}
                        </div>
                        <span className="text-xs text-stone-500">{post.ownerName}</span>
                        <span className="text-stone-200 text-xs">·</span>
                        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                            {post.verses.length}구절
                        </span>
                        <span className="text-stone-200 text-xs">·</span>
                        <span className="text-xs text-stone-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Verse preview */}
                    {post.verses[0] && (
                        <div className="bg-stone-50 rounded-xl p-3 mb-4 border border-stone-100">
                            <p className="text-stone-600 text-xs leading-relaxed line-clamp-2 italic">
                                "{post.verses[0].text["ko"] ?? post.verses[0].text["en"] ?? ""}"
                            </p>
                            <p className="text-amber-500 text-[10px] font-bold mt-1">
                                {post.verses[0].reference["ko"] ?? post.verses[0].reference["en"] ?? ""}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <ReactionBtn
                            emoji="🙏" count={post.reactions.pray.length}
                            active={myReacted("pray")} onClick={() => handleReact("pray")}
                        />
                        <ReactionBtn
                            emoji="❤️" count={post.reactions.heart.length}
                            active={myReacted("heart")} onClick={() => handleReact("heart")}
                        />
                        <ReactionBtn
                            emoji="👍" count={post.reactions.thumbs.length}
                            active={myReacted("thumbs")} onClick={() => handleReact("thumbs")}
                        />
                        <button
                            onClick={() => setShowComments(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-stone-500 hover:bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all ml-auto"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.commentCount > 0 ? `댓글 ${post.commentCount}개` : "댓글"}
                        </button>
                    </div>
                </div>
            </div>

            {showComments && (
                <CommentModal post={post} onClose={() => setShowComments(false)} />
            )}
        </>
    );
}

// ---------- LEADERBOARD TAB ----------
function LeaderboardTab() {
    const { entries, loading } = useLeaderboard(50);
    const { user } = useAuth();

    const rankEmoji = (i: number) => {
        if (i === 0) return "🥇";
        if (i === 1) return "🥈";
        if (i === 2) return "🥉";
        return `${i + 1}`;
    };

    if (loading) return (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-300" />
        </div>
    );

    if (entries.length === 0) return (
        <div className="text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="font-bold text-stone-700 text-lg mb-2">아직 랭킹이 없어요</h3>
            <p className="text-stone-400 text-sm">구절을 외우면 랭킹에 올라와요!</p>
        </div>
    );

    return (
        <div className="space-y-2">
            {entries.map((entry, i) => (
                <div
                    key={entry.uid}
                    className={cn(
                        "flex items-center gap-4 bg-white rounded-2xl px-4 py-3 border transition-all",
                        entry.uid === user?.uid
                            ? "border-amber-300 bg-amber-50 shadow-md"
                            : "border-stone-100 hover:border-stone-200"
                    )}
                >
                    {/* Rank */}
                    <div className="w-10 text-center flex-shrink-0">
                        {i < 3 ? (
                            <span className="text-2xl">{rankEmoji(i)}</span>
                        ) : (
                            <span className="font-bold text-stone-400 text-sm">{i + 1}</span>
                        )}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {entry.displayName?.[0] ?? "?"}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-900 text-sm truncate">
                            {entry.displayName}
                            {entry.uid === user?.uid && <span className="text-amber-600 text-xs ml-1">(나)</span>}
                        </p>
                        {entry.streakDays > 0 && (
                            <p className="text-xs text-stone-400">🔥 {entry.streakDays}일 연속</p>
                        )}
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                        <p className="font-bold text-stone-900 text-lg">{entry.totalMemorized}</p>
                        <p className="text-stone-400 text-[10px]">구절 암기</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ---------- MAIN PAGE ----------
type TabType = "feed" | "ranking";

export default function CommunityPage() {
    const router = useRouter();
    const [tab, setTab] = useState<TabType>("feed");
    const { posts, loading } = useCommunityFeed(30);

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            <Navbar />

            {/* Header */}
            <div className="bg-white border-b border-stone-100 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-6">
                    {/* Title row */}
                    <div className="py-4 flex items-center gap-4">
                        <button onClick={() => router.push("/")} className="text-stone-400 hover:text-stone-700 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="font-bold text-stone-900 text-lg">커뮤니티</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 pb-0">
                        {([
                            { id: "feed", label: "🆕 최신 시리즈" },
                            { id: "ranking", label: "🏆 랭킹" },
                        ] as { id: TabType; label: string }[]).map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all border-b-2",
                                    tab === t.id
                                        ? "border-amber-500 text-amber-600"
                                        : "border-transparent text-stone-400 hover:text-stone-600"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-2xl mx-auto w-full px-6 py-6 flex-1">
                {tab === "feed" && (
                    loading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">📖</div>
                            <h3 className="font-bold text-stone-700 text-lg mb-2">아직 공유된 시리즈가 없어요</h3>
                            <p className="text-stone-400 text-sm mb-6">내 시리즈를 만들고 첫 번째로 공유해보세요!</p>
                            <button
                                onClick={() => router.push("/bible")}
                                className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all"
                            >
                                내 시리즈 만들기
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                                {posts.length}개의 공유 시리즈
                            </p>
                            {posts.map(post => (
                                <SeriesCard key={post.shareId} post={post} />
                            ))}
                        </div>
                    )
                )}

                {tab === "ranking" && <LeaderboardTab />}
            </main>
        </div>
    );
}
