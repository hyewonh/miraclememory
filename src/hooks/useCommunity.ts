"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
    collection, query, orderBy, onSnapshot, limit,
    updateDoc, doc, arrayUnion, arrayRemove,
    addDoc, serverTimestamp, getDocs
} from "firebase/firestore";
import { SharedSeries } from "@/hooks/useCustomSeries";

export interface CommunityPost extends SharedSeries {
    reactions: {
        pray: string[];   // uids
        heart: string[];
        thumbs: string[];
    };
    commentCount: number;
}

export interface Comment {
    id: string;
    authorUid: string;
    authorName: string;
    text: string;
    createdAt: number;
}

export type ReactionType = "pray" | "heart" | "thumbs";

export function useCommunityFeed(pageLimit = 20) {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "shared_series"),
            orderBy("createdAt", "desc"),
            limit(pageLimit)
        );
        const unsub = onSnapshot(q, snap => {
            setPosts(snap.docs.map(d => {
                const data = d.data();
                return {
                    ...data,
                    shareId: d.id,
                    reactions: data.reactions ?? { pray: [], heart: [], thumbs: [] },
                    commentCount: data.commentCount ?? 0,
                } as CommunityPost;
            }));
            setLoading(false);
        });
        return () => unsub();
    }, [pageLimit]);

    return { posts, loading };
}

export function useReaction(shareId: string) {
    const { user } = useAuth();

    const toggleReaction = useCallback(async (type: ReactionType) => {
        if (!user) return;
        const ref = doc(db, "shared_series", shareId);
        // Check current state from local store handled by parent
        // We pass currentReacted from the parent
        return { ref, uid: user.uid, type };
    }, [user, shareId]);

    const react = useCallback(async (type: ReactionType, already: boolean) => {
        if (!user) return;
        const ref = doc(db, "shared_series", shareId);
        const field = `reactions.${type}`;
        await updateDoc(ref, {
            [field]: already ? arrayRemove(user.uid) : arrayUnion(user.uid),
        });
    }, [user, shareId]);

    return { react };
}

export function useComments(shareId: string) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!shareId) { setLoading(false); return; }
        const q = query(
            collection(db, "shared_series", shareId, "comments"),
            orderBy("createdAt", "asc"),
            limit(50)
        );
        const unsub = onSnapshot(q, snap => {
            setComments(snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toMillis?.() ?? Date.now(),
            } as Comment)));
            setLoading(false);
        });
        return () => unsub();
    }, [shareId]);

    const addComment = useCallback(async (text: string) => {
        if (!user || !text.trim()) return;
        await addDoc(collection(db, "shared_series", shareId, "comments"), {
            authorUid: user.uid,
            authorName: user.displayName || "익명",
            text: text.trim(),
            createdAt: serverTimestamp(),
        });
        // Increment commentCount denorm
        await updateDoc(doc(db, "shared_series", shareId), {
            commentCount: (await getDocs(collection(db, "shared_series", shareId, "comments"))).size,
        });
    }, [user, shareId]);

    return { comments, loading, addComment };
}
