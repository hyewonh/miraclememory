"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
    collection, addDoc, deleteDoc, doc, onSnapshot,
    query, orderBy, serverTimestamp, updateDoc, arrayUnion, arrayRemove
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

    return { series, loading, createSeries, deleteSeries, addVerse, removeVerse };
}
