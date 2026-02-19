import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { Verse } from "@/types";

// Temporary mock data until we seed Firestore
const MOCK_VERSES: Verse[] = [
    {
        id: "1",
        seriesId: "series-1",
        order: 1,
        reference: { en: "Philippians 4:6-7", ko: "빌립보서 4:6-7", zh: "Philippians 4:6-7", es: "Philippians 4:6-7", de: "Philipper 4:6-7", fr: "Philippiens 4:6-7" },
        text: {
            en: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
            ko: "아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라. 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라.",
            zh: "Do not be anxious about anything...",
            es: "Do not be anxious about anything...",
            de: "Sorgt euch um nichts...",
            fr: "Ne vous inquiétez de rien..."
        },
        tags: ["Peace", "Anxiety"]
    },
    {
        id: "2",
        seriesId: "series-1",
        order: 2,
        reference: { en: "Isaiah 41:10", ko: "이사야 41:10", zh: "Isaiah 41:10", es: "Isaiah 41:10", de: "Jesaja 41:10", fr: "Ésaïe 41:10" },
        text: {
            en: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
            ko: "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라 참으로 나의 의로운 오른손으로 너를 붙들리라",
            zh: "So do not fear...",
            es: "So do not fear...",
            de: "So do not fear...",
            fr: "So do not fear..."
        },
        tags: ["Fear", "Strength"]
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
