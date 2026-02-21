// Server-side ESV API proxy — keeps API key safe from client
import { NextRequest, NextResponse } from "next/server";

const ESV_API_BASE = "https://api.esv.org/v3/passage/text/";
const API_KEY = process.env.ESV_API_KEY!;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const passage = searchParams.get("q");

    if (!passage) {
        return NextResponse.json({ error: "Missing passage query" }, { status: 400 });
    }

    try {
        const params = new URLSearchParams({
            q: passage,
            "include-headings": "false",
            "include-footnotes": "false",
            "include-verse-numbers": "false",
            "include-short-copyright": "false",
            "include-passage-references": "false",
        });

        const res = await fetch(`${ESV_API_BASE}?${params}`, {
            headers: { Authorization: `Token ${API_KEY}` },
            next: { revalidate: 86400 }, // Cache for 24h on server
        });

        if (!res.ok) {
            console.error("ESV API error:", res.status, res.statusText);
            return NextResponse.json({ error: "ESV API error" }, { status: res.status });
        }

        const data = await res.json();
        const text = data.passages?.[0]?.trim() ?? null;

        return NextResponse.json({ text, canonical: data.canonical });
    } catch (err) {
        console.error("ESV proxy error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
