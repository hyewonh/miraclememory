// Server-side proxy for bible-api.com — prevents CORS errors for KO/ZH/ES/DE/FR
import { NextRequest, NextResponse } from "next/server";

const BIBLE_API_TRANSLATIONS: Record<string, string> = {
    ko: "korean",
    zh: "chinese",
    es: "reinavalera",
    de: "luther1912",
    fr: "louis-segond",
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const passage = searchParams.get("q");
    const language = searchParams.get("lang");

    if (!passage || !language) {
        return NextResponse.json({ error: "Missing q or lang parameter" }, { status: 400 });
    }

    const translation = BIBLE_API_TRANSLATIONS[language];
    if (!translation) {
        return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    try {
        const res = await fetch(
            `https://bible-api.com/${encodeURIComponent(passage)}?translation=${translation}`,
            { next: { revalidate: 86400 } } // Cache for 24h on server
        );

        if (!res.ok) {
            return NextResponse.json({ error: "bible-api.com error" }, { status: res.status });
        }

        const data = await res.json();
        if (data.error) {
            return NextResponse.json({ error: data.error }, { status: 404 });
        }

        // Join verses into a single string
        let text: string | null = null;
        if (data.verses && Array.isArray(data.verses)) {
            text = data.verses.map((v: { text: string }) => v.text.trim()).join(" ");
        } else if (data.text) {
            text = data.text.trim();
        }

        return NextResponse.json({ text });
    } catch (err) {
        console.error("Bible API proxy error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
