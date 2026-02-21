/**
 * LocalStorage caching service for verse data.
 * Reduces redundant re-computation / future Firebase reads.
 * TTL: 7 days.
 */

const CACHE_VERSION = "v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry<T> {
    data: T;
    cachedAt: number;
    version: string;
}

function getCacheKey(seriesId: string): string {
    return `mm_verses_${seriesId}`;
}

export function cacheVerses<T>(seriesId: string, verses: T[]): void {
    if (typeof window === "undefined") return;
    try {
        const entry: CacheEntry<T[]> = {
            data: verses,
            cachedAt: Date.now(),
            version: CACHE_VERSION,
        };
        localStorage.setItem(getCacheKey(seriesId), JSON.stringify(entry));
    } catch (e) {
        // localStorage may be full or unavailable — fail silently
        console.warn("[verseCache] Failed to cache verses:", e);
    }
}

export function getCachedVerses<T>(seriesId: string): T[] | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(getCacheKey(seriesId));
        if (!raw) return null;

        const entry: CacheEntry<T[]> = JSON.parse(raw);

        // Invalidate if version mismatch or TTL exceeded
        if (entry.version !== CACHE_VERSION) {
            invalidateCache(seriesId);
            return null;
        }
        if (Date.now() - entry.cachedAt > TTL_MS) {
            invalidateCache(seriesId);
            return null;
        }

        return entry.data;
    } catch (e) {
        console.warn("[verseCache] Failed to read cached verses:", e);
        return null;
    }
}

export function invalidateCache(seriesId: string): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(getCacheKey(seriesId));
    } catch (e) {
        console.warn("[verseCache] Failed to invalidate cache:", e);
    }
}

export function invalidateAllCaches(): void {
    if (typeof window === "undefined") return;
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("mm_verses_")) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
        console.warn("[verseCache] Failed to invalidate all caches:", e);
    }
}
