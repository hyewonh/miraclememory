export type Language = 'en' | 'ko' | 'zh' | 'es' | 'de' | 'fr';

export interface MultiLanguageContent {
    en: string;
    ko: string;
    zh: string;
    es: string;
    de: string;
    fr: string;
}

export interface Series {
    id: string;
    title: MultiLanguageContent;
    description: MultiLanguageContent;
    coverImage?: string;
    totalVerses: number;
}

export interface Verse {
    id: string;
    seriesId: string;
    order: number; // 1, 2, 3...
    reference: MultiLanguageContent;
    text: MultiLanguageContent;
    audioUrl?: string; // Pro narration
    tags: string[];
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    isPremium: boolean;
    subscriptionStatus: 'active' | 'trial' | 'expired' | 'none';
    subscriptionId?: string;
    trialStartDate?: Date;
    streak: number;
    lastPracticeDate: Date | null;
    settings: {
        language: Language;
        bgmEnabled: boolean;
    };
}

export interface UserProgress {
    userId: string;
    verseId: string;
    stage: number; // 0: New, 1: Learning, 2: Reviewing, 3: Mastered
    nextReviewDate: Date;
    lastReviewedDate: Date;
    recordingUrl?: string; // User's own recording
    language: Language; // Track progress per language
}

export interface Friend {
    id: string; // User ID
    displayName: string;
    photoURL?: string;
    level: number;
    streak: number;
}
