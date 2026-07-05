// useEsvChapter — loads a chapter's verses as live ESV text for the browse grid.
//
// Resolution order (English only):
//   1. IndexedDB chapter cache  (usually hits — one API call per chapter per 30d)
//   2. /api/esv-chapter          (ESV live; 429 / error falls through)
//   3. Static /bible/en/{book}.json  (public-domain fallback, offline-safe)
//
// Returns the chapter's verse map plus `source` so the UI can flag when it is
// showing the offline fallback instead of ESV.
"use client";
import { useState, useEffect } from "react";
import { getCachedChapter, cacheChapter } from "@/lib/bibleCache";

export type ChapterSource = "esv" | "fallback" | null;

interface UseEsvChapterResult {
    verses: Record<string, string> | null;
    loading: boolean;
    source: ChapterSource;
}

// In-memory cache keyed by book+chapter to avoid re-fetching within a session.
const memCache: Record<string, { verses: Record<string, string>; source: ChapterSource }> = {};

async function fetchStaticFallback(bookId: string, chapter: number): Promise<Record<string, string> | null> {
    try {
        const res = await fetch(`/bible/en/${bookId}.json`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.chapters?.[String(chapter)] ?? null;
    } catch {
        return null;
    }
}

export function useEsvChapter(
    bookId: string | null,
    chapter: number | null,
    bookNameEn: string | undefined,
    enabled: boolean
): UseEsvChapterResult {
    const [verses, setVerses] = useState<Record<string, string> | null>(null);
    const [loading, setLoading] = useState(false);
    const [source, setSource] = useState<ChapterSource>(null);

    useEffect(() => {
        if (!enabled || !bookId || !chapter || !bookNameEn) {
            setVerses(null);
            setSource(null);
            return;
        }

        const memKey = `${bookId}_${chapter}`;
        if (memCache[memKey]) {
            setVerses(memCache[memKey].verses);
            setSource(memCache[memKey].source);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setSource(null);

        const load = async () => {
            // 1. IndexedDB chapter cache
            const cached = await getCachedChapter(bookId, chapter, "en");
            if (cancelled) return;
            if (cached) {
                memCache[memKey] = { verses: cached, source: "esv" };
                setVerses(cached);
                setSource("esv");
                setLoading(false);
                return;
            }

            // 2. Live ESV (one call for the whole chapter)
            try {
                const q = `${bookNameEn} ${chapter}`;
                const res = await fetch(`/api/esv-chapter?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                    const data = await res.json();
                    const esvVerses: Record<string, string> | undefined = data.verses;
                    if (esvVerses && Object.keys(esvVerses).length > 0) {
                        if (cancelled) return;
                        await cacheChapter(bookId, chapter, "en", esvVerses);
                        memCache[memKey] = { verses: esvVerses, source: "esv" };
                        setVerses(esvVerses);
                        setSource("esv");
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // fall through to static fallback
            }
            if (cancelled) return;

            // 3. Static public-domain fallback (offline / rate-limited)
            const fallback = await fetchStaticFallback(bookId, chapter);
            if (cancelled) return;
            if (fallback) {
                memCache[memKey] = { verses: fallback, source: "fallback" };
                setVerses(fallback);
                setSource("fallback");
            } else {
                setVerses(null);
                setSource(null);
            }
            setLoading(false);
        };

        load();
        return () => { cancelled = true; };
    }, [bookId, chapter, bookNameEn, enabled]);

    return { verses, loading, source };
}
