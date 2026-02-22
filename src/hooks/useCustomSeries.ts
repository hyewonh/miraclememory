"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
    collection, addDoc, deleteDoc, doc, onSnapshot,
    query, orderBy, updateDoc, arrayUnion, arrayRemove,
    setDoc, getDoc
} from "firebase/firestore";

export interface CustomVerseRef {
    id: string;       // e.g. "genesis-1-1"
    bookId: string;
    chapter: number;
    verse: number;
    text: Record<string, string>;   // { ko, en, zh, es, de, fr }
    reference: Record<string, string>;
}

export interface CustomSeries {
    id: string;                 // Firestore doc ID
    title: string;
    description: string;
    verses: CustomVerseRef[];
    createdAt: number;
    updatedAt: number;
    shareId?: string;           // set when published
}

export interface SharedSeries {
    title: string;
    description: string;
    verses: CustomVerseRef[];
    ownerUid: string;
    ownerName: string;
    createdAt: number;
    shareId: string;
}

export function useCustomSeries() {
    const { user } = useAuth();
    const [series, setSeries] = useState<CustomSeries[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setSeries([]); setLoading(false); return; }

        const q = query(
            collection(db, "users", user.uid, "custom_series"),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, snap => {
            setSeries(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomSeries)));
            setLoading(false);
        });
        return () => unsub();
    }, [user]);

    const createSeries = useCallback(async (title: string, description: string) => {
        if (!user) return null;
        const ref = await addDoc(collection(db, "users", user.uid, "custom_series"), {
            title,
            description,
            verses: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return ref.id;
    }, [user]);

    const deleteSeries = useCallback(async (seriesId: string) => {
        if (!user) return;
        // Also remove from shared_series if published
        try {
            const seriesDoc = await getDoc(doc(db, "users", user.uid, "custom_series", seriesId));
            const data = seriesDoc.data();
            if (data?.shareId) {
                await deleteDoc(doc(db, "shared_series", data.shareId));
            }
        } catch { /* ignore */ }
        await deleteDoc(doc(db, "users", user.uid, "custom_series", seriesId));
    }, [user]);

    const addVerse = useCallback(async (seriesId: string, verse: CustomVerseRef) => {
        if (!user) return;
        await updateDoc(doc(db, "users", user.uid, "custom_series", seriesId), {
            verses: arrayUnion(verse),
            updatedAt: Date.now(),
        });
    }, [user]);

    const removeVerse = useCallback(async (seriesId: string, verse: CustomVerseRef) => {
        if (!user) return;
        await updateDoc(doc(db, "users", user.uid, "custom_series", seriesId), {
            verses: arrayRemove(verse),
            updatedAt: Date.now(),
        });
    }, [user]);

    /** Publish series to public shared_series collection. Returns shareId. */
    const publishSeries = useCallback(async (cs: CustomSeries): Promise<string> => {
        if (!user) throw new Error("Not logged in");
        const shareId = cs.shareId ?? `${user.uid}_${cs.id}`;
        const sharedData: SharedSeries = {
            title: cs.title,
            description: cs.description,
            verses: cs.verses,
            ownerUid: user.uid,
            ownerName: user.displayName || "익명",
            createdAt: cs.createdAt,
            shareId,
        };
        await setDoc(doc(db, "shared_series", shareId), sharedData);
        // Save shareId back to user's doc
        await updateDoc(doc(db, "users", user.uid, "custom_series", cs.id), { shareId });
        return shareId;
    }, [user]);

    /** Import a shared series into logged-in user's library */
    const importSharedSeries = useCallback(async (shared: SharedSeries): Promise<string | null> => {
        if (!user) return null;
        const ref = await addDoc(collection(db, "users", user.uid, "custom_series"), {
            title: shared.title,
            description: shared.description,
            verses: shared.verses,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return ref.id;
    }, [user]);

    return { series, loading, createSeries, deleteSeries, addVerse, removeVerse, publishSeries, importSharedSeries };
}
