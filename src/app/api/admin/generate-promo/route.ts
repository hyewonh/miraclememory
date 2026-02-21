import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";

const ADMIN_EMAILS = ["hyewonh@gmail.com"];

function generateCode(length = 8): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        if (i === 4) result += "-";
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// POST /api/admin/generate-promo
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { adminEmail, type, count = 1, note = "", expiryDays = 365 } = body;

        if (!ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (!["1month", "1year", "lifetime"].includes(type)) {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        const codes: string[] = [];

        for (let i = 0; i < Math.min(count, 50); i++) {
            const code = generateCode(8);
            await setDoc(doc(db, "admin_promo_codes", code), {
                type,
                used: false,
                usedBy: null,
                usedAt: null,
                createdAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
                createdBy: adminEmail,
                note,
            });
            codes.push(code);
        }

        return NextResponse.json({ success: true, codes });
    } catch (err: any) {
        console.error("generate-promo error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET /api/admin/generate-promo?adminEmail=...
export async function GET(req: NextRequest) {
    const adminEmail = req.nextUrl.searchParams.get("adminEmail") || "";
    if (!ADMIN_EMAILS.includes(adminEmail)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const q = query(collection(db, "admin_promo_codes"), orderBy("createdAt", "desc"), limit(100));
        const snap = await getDocs(q);
        const codes = snap.docs.map(d => ({ code: d.id, ...d.data() }));
        return NextResponse.json({ success: true, codes });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
