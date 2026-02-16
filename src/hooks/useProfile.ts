"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { UserProfile } from "@/types";

export function useProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        const docRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Convert Firestore Timestamp to JS Date
                const profileData = {
                    ...data,
                    trialStartDate: data.trialStartDate?.toDate ? data.trialStartDate.toDate() : data.trialStartDate,
                    lastPracticeDate: data.lastPracticeDate?.toDate ? data.lastPracticeDate.toDate() : data.lastPracticeDate,
                } as UserProfile;
                setProfile(profileData);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { profile, loading };
}
