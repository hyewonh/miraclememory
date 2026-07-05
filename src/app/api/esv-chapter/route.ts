// Server-side ESV API proxy — fetches a whole CHAPTER in one call and returns
// it as a structured { "1": "text", "2": "text", ... } map.
//
// One HTTP call per chapter keeps us well under the ESV 5,000-verses/day quota
// (the client caches each chapter in IndexedDB, so a chapter is usually fetched
// once per device per 30 days). Used by the Bible browse/search grid.
import { NextRequest, NextResponse } from "next/server";

const ESV_API_BASE = "https://api.esv.org/v3/passage/text/";
const API_KEY = process.env.ESV_API_KEY!;

// Match a verse marker like "[1]" or, across chapters, "[3:16]". We keep only
// the trailing verse number.
const VERSE_MARKER = /\[(?:\d+:)?(\d+)\]/g;

/** Parse the ESV text blob "[1] foo [2] bar" into { "1": "foo", "2": "bar" }. */
function parseVerses(passage: string): Record<string, string> {
    const verses: Record<string, string> = {};
    const matches = [...passage.matchAll(VERSE_MARKER)];
    for (let i = 0; i < matches.length; i++) {
        const num = matches[i][1];
        const start = matches[i].index! + matches[i][0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index! : passage.length;
        const text = passage.slice(start, end).replace(/\s+/g, " ").trim();
        if (text) verses[num] = text;
    }
    return verses;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const passageRef = searchParams.get("q"); // e.g. "John 1"

    if (!passageRef) {
        return NextResponse.json({ error: "Missing passage query" }, { status: 400 });
    }

    try {
        const params = new URLSearchParams({
            q: passageRef,
            "include-headings": "false",
            "include-footnotes": "false",
            "include-verse-numbers": "true",
            "include-first-verse-numbers": "true",
            "include-short-copyright": "false",
            "include-passage-references": "false",
        });

        const res = await fetch(`${ESV_API_BASE}?${params}`, {
            headers: { Authorization: `Token ${API_KEY}` },
            next: { revalidate: 60 * 60 * 24 * 30 }, // Cache 30 days on the server
        });

        if (!res.ok) {
            console.error("ESV chapter API error:", res.status, res.statusText);
            // 429 = rate limit; surface the status so the client can fall back.
            return NextResponse.json({ error: "ESV API error" }, { status: res.status });
        }

        const data = await res.json();
        const passage = data.passages?.[0] ?? "";
        const verses = parseVerses(passage);

        if (Object.keys(verses).length === 0) {
            return NextResponse.json({ error: "No verses parsed" }, { status: 502 });
        }

        return NextResponse.json({ reference: data.canonical ?? passageRef, verses });
    } catch (err) {
        console.error("ESV chapter proxy error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
