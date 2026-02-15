import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { Verse } from "@/types";

// Temporary mock data until we seed Firestore
const MOCK_VERSES: Verse[] = [
    {
        id: "1",
        reference: "Philippians 4:6-7",
        text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
        translation: "NIV",
        category: "Peace",
        tags: ["anxiety", "prayer", "peace"]
    },
    {
        id: "2",
        reference: "Isaiah 41:10",
        text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
        translation: "NIV",
        category: "Strength",
        tags: ["fear", "strength", "comfort"]
    }
];

export async function getDailyVerse(): Promise<Verse> {
    // In a real app, this would query Firestore for a "daily" verse or random one
    // For MVP, return the first mock verse
    return MOCK_VERSES[0];
}

export async function getAllVerses(): Promise<Verse[]> {
    // const querySnapshot = await getDocs(collection(db, "verses"));
    // return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Verse));
    return MOCK_VERSES;
}

export async function getUserProgress(userId: string) {
    // Implementation for fetching user progress
    return [];
}
