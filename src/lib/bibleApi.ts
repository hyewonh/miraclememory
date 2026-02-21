// Central Bible API client — routes by language, uses IndexedDB cache
import { getCachedVerse, cacheVerse } from "./bibleCache";

/**
 * Fetch a single verse or passage in the given language.
 * Cache-first: IndexedDB → API → cache → return.
 * Falls back gracefully if API is unavailable.
 */
export async function fetchVerseText(
    reference: string, // e.g. "John 3:16" or "Romans 1:16-17"
    language: string   // "en" | "ko" | "zh" | "es" | "de" | "fr"
): Promise<string | null> {
    // 1. Check IndexedDB cache
    const cached = await getCachedVerse(reference, language);
    if (cached) return cached;

    // 2. Fetch from API
    let text: string | null = null;

    try {
        if (language === "en") {
            text = await fetchESV(reference);
        } else {
            text = await fetchBibleApi(reference, language);
        }
    } catch (err) {
        console.warn(`[bibleApi] fetch failed for ${reference} (${language}):`, err);
        return null;
    }

    // 3. Save to cache
    if (text) {
        await cacheVerse(reference, language, text);
    }

    return text;
}

// ------------------------------------------------------------------
// ESV (English) — via our server-side proxy to protect the API key
// ------------------------------------------------------------------
async function fetchESV(reference: string): Promise<string | null> {
    const res = await fetch(`/api/esv?q=${encodeURIComponent(reference)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.text ?? null;
}

// ------------------------------------------------------------------
// All other languages — via our /api/bible server proxy (CORS fix)
// bible-api.com serves KRV, CUV, RVA, Luther1912, Louis Segond
// ------------------------------------------------------------------
async function fetchBibleApi(reference: string, language: string): Promise<string | null> {
    const res = await fetch(
        `/api/bible?q=${encodeURIComponent(reference)}&lang=${language}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.text ?? null;
}
