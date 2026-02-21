// Referral & Points service — handles all growth-related Firestore operations
import { db } from "@/lib/firebase";
import {
    doc, getDoc, setDoc, updateDoc, collection,
    addDoc, serverTimestamp, increment, runTransaction
} from "firebase/firestore";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────
export type UserTier = "friend" | "champion" | "ambassador";

export interface UserRewardProfile {
    uid: string;
    referralCode: string;
    referredBy: string | null;
    points: number;
    tier: UserTier;
    isPremium: boolean;
    premiumExpiresAt: Date | null; // null = lifetime
    referralSignups: number;
    referralConversions: number;
}

export interface PromoCode {
    code: string;
    ownerUid: string;
    type: "1month" | "1year" | "lifetime";
    used: boolean;
    expiresAt: Date;
    createdAt: Date;
}

// ─────────────────────────────────────────────────
// Tier rules
// ─────────────────────────────────────────────────
export const TIER_RULES = {
    champion: { conversionsRequired: 3 },
    ambassador: { conversionsRequired: 10 },
};

export const POINT_REWARDS = {
    referralSignup: 500,
    referralConversion: 3000,
    verse10Memorized: 200,
    seriesComplete: 1000,
};

export const POINT_THRESHOLDS = [
    { points: 5000, reward: "1month" as const },
    { points: 10000, reward: "1year" as const },
];

// ─────────────────────────────────────────────────
// Unique code generator (e.g. A7B9-X2K1)
// ─────────────────────────────────────────────────
export function generateUniqueCode(length = 8): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars
    let result = "";
    for (let i = 0; i < length; i++) {
        if (i === 4) result += "-";
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// ─────────────────────────────────────────────────
// Initialize referral profile on first sign-up
// ─────────────────────────────────────────────────
export async function initializeUserRewards(
    uid: string,
    referralCodeUsed?: string
): Promise<string> {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    // Already initialized
    if (snap.exists() && snap.data()?.referralCode) {
        return snap.data().referralCode;
    }

    const myReferralCode = generateUniqueCode(8);

    // Find referrer uid if a code was provided
    let referredBy: string | null = null;
    if (referralCodeUsed) {
        const refDoc = await getDoc(doc(db, "referrals", referralCodeUsed));
        if (refDoc.exists()) {
            referredBy = refDoc.data().ownerUid;
        }
    }

    const rewardData = {
        referralCode: myReferralCode,
        referredBy,
        points: 0,
        tier: "friend" as UserTier,
        isPremium: false,
        premiumExpiresAt: null,
        referralSignups: 0,
        referralConversions: 0,
    };

    // Store in user doc
    await setDoc(userRef, rewardData, { merge: true });

    // Create referrals lookup entry
    await setDoc(doc(db, "referrals", myReferralCode), {
        ownerUid: uid,
        signups: 0,
        conversions: 0,
        createdAt: serverTimestamp(),
    });

    // Credit referrer for the signup
    if (referredBy) {
        await addPoints(referredBy, POINT_REWARDS.referralSignup, "referral_signup");
        await updateDoc(doc(db, "users", referredBy), {
            referralSignups: increment(1),
        });
        await updateDoc(doc(db, "referrals", referralCodeUsed!), {
            signups: increment(1),
        });
    }

    return myReferralCode;
}

// ─────────────────────────────────────────────────
// Add points and trigger milestone rewards
// ─────────────────────────────────────────────────
export async function addPoints(
    uid: string,
    amount: number,
    reason: string
): Promise<void> {
    await runTransaction(db, async (tx) => {
        const userRef = doc(db, "users", uid);
        const snap = await tx.get(userRef);
        if (!snap.exists()) return;

        const currentPoints: number = snap.data().points || 0;
        const newPoints = currentPoints + amount;

        tx.update(userRef, { points: newPoints });

        // Log the event
        tx.set(doc(collection(db, "users", uid, "pointEvents")), {
            amount,
            reason,
            balanceBefore: currentPoints,
            balanceAfter: newPoints,
            createdAt: serverTimestamp(),
        });
    });

    // Check milestones after transaction
    await checkPointMilestones(uid);
}

// ─────────────────────────────────────────────────
// Check if user hit a point milestone → issue promo code
// ─────────────────────────────────────────────────
async function checkPointMilestones(uid: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const points: number = data.points || 0;
    const awardedMilestones: string[] = data.awardedMilestones || [];

    for (const milestone of POINT_THRESHOLDS) {
        const key = `milestone_${milestone.points}`;
        if (points >= milestone.points && !awardedMilestones.includes(key)) {
            // Issue the promo code
            await issuePromoCode(uid, milestone.reward);
            // Mark milestone as awarded
            await updateDoc(userRef, {
                awardedMilestones: [...awardedMilestones, key],
            });
        }
    }
}

// ─────────────────────────────────────────────────
// Issue a one-time promo code (one per event)
// ─────────────────────────────────────────────────
export async function issuePromoCode(
    uid: string,
    type: PromoCode["type"]
): Promise<string> {
    const code = generateUniqueCode(8);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Valid for 1 year

    await setDoc(doc(db, "promo_codes", code), {
        ownerUid: uid,
        type,
        used: false,
        expiresAt,
        createdAt: new Date(),
    });

    // Store reference in user's sub-collection for easy retrieval
    await addDoc(collection(db, "users", uid, "promoCodes"), {
        code,
        type,
        used: false,
        issuedAt: serverTimestamp(),
    });

    return code;
}

// ─────────────────────────────────────────────────
// Apply a promo code — returns premium duration granted
// ─────────────────────────────────────────────────
export async function applyPromoCode(
    uid: string,
    code: string
): Promise<{ success: boolean; type?: PromoCode["type"]; error?: string }> {
    const codeRef = doc(db, "promo_codes", code.toUpperCase());
    const snap = await getDoc(codeRef);

    if (!snap.exists()) return { success: false, error: "Invalid code" };

    const data = snap.data() as PromoCode;

    if (data.used) return { success: false, error: "Code already used" };
    if (data.ownerUid !== uid) return { success: false, error: "This code is not yours" };
    if (data.expiresAt < new Date()) return { success: false, error: "Code has expired" };

    // Mark as used
    await updateDoc(codeRef, { used: true, usedAt: serverTimestamp() });

    // Apply premium
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const currentExpiry: Date | null = userSnap.data()?.premiumExpiresAt?.toDate() ?? null;

    let newExpiry: Date | null = null;
    const now = new Date();
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;

    if (data.type === "lifetime") {
        newExpiry = null; // null = lifetime
    } else if (data.type === "1year") {
        newExpiry = new Date(base);
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    } else if (data.type === "1month") {
        newExpiry = new Date(base);
        newExpiry.setMonth(newExpiry.getMonth() + 1);
    }

    await updateDoc(userRef, {
        isPremium: true,
        premiumExpiresAt: newExpiry,
    });

    return { success: true, type: data.type };
}

// ─────────────────────────────────────────────────
// Credit referrer on subscription paid
// ─────────────────────────────────────────────────
export async function onSubscriptionConversion(referredUid: string): Promise<void> {
    const referredSnap = await getDoc(doc(db, "users", referredUid));
    if (!referredSnap.exists()) return;

    const referredBy: string | null = referredSnap.data().referredBy ?? null;
    if (!referredBy) return;

    // Credit 3000 points to referrer
    await addPoints(referredBy, POINT_REWARDS.referralConversion, "referral_conversion");

    // Increment conversion count
    const referrerSnap = await getDoc(doc(db, "users", referredBy));
    if (!referrerSnap.exists()) return;

    const newConversions = (referrerSnap.data().referralConversions || 0) + 1;
    const newTier: UserTier =
        newConversions >= TIER_RULES.ambassador.conversionsRequired
            ? "ambassador"
            : newConversions >= TIER_RULES.champion.conversionsRequired
                ? "champion"
                : "friend";

    await updateDoc(doc(db, "users", referredBy), {
        referralConversions: newConversions,
        tier: newTier,
    });

    // Ambassador = lifetime premium
    if (newTier === "ambassador" && referrerSnap.data().tier !== "ambassador") {
        await issuePromoCode(referredBy, "lifetime");
    }
}

// ─────────────────────────────────────────────────
// Load user reward profile
// ─────────────────────────────────────────────────
export async function getUserRewardProfile(uid: string): Promise<UserRewardProfile | null> {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
        uid,
        referralCode: d.referralCode ?? "",
        referredBy: d.referredBy ?? null,
        points: d.points ?? 0,
        tier: d.tier ?? "friend",
        isPremium: d.isPremium ?? false,
        premiumExpiresAt: d.premiumExpiresAt?.toDate() ?? null,
        referralSignups: d.referralSignups ?? 0,
        referralConversions: d.referralConversions ?? 0,
    };
}
