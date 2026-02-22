"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    photoURL?: string;
    totalMemorized: number;
    streakDays: number;
    updatedAt: number;
}

export function useLeaderboard(top = 50) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "leaderboard"),
            orderBy("totalMemorized", "desc"),
            limit(top)
        );
        const unsub = onSnapshot(q, snap => {
            setEntries(snap.docs.map(d => ({ uid: d.id, ...d.data() } as LeaderboardEntry)));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, [top]);

    return { entries, loading };
}
