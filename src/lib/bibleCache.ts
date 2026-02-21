// IndexedDB cache for Bible verses — 30-day TTL
// Uses the lightweight 'idb-keyval' approach with raw IndexedDB to avoid extra deps

const DB_NAME = "miraclememory-bible";
const STORE_NAME = "verses";
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const DB_VERSION = 1;

interface CachedVerse {
    text: string;
    cachedAt: number;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function cacheKey(reference: string, language: string) {
    return `${language}::${reference.toLowerCase().replace(/\s+/g, "_")}`;
}

export async function getCachedVerse(
    reference: string,
    language: string
): Promise<string | null> {
    try {
        const db = await openDB();
        const key = cacheKey(reference, language);
        const result = await new Promise<CachedVerse | undefined>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const req = tx.objectStore(STORE_NAME).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        if (!result) return null;
        if (Date.now() - result.cachedAt > TTL_MS) return null; // Expired
        return result.text;
    } catch {
        return null; // IndexedDB unavailable (SSR, private browsing)
    }
}

export async function cacheVerse(
    reference: string,
    language: string,
    text: string
): Promise<void> {
    try {
        const db = await openDB();
        const key = cacheKey(reference, language);
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const req = tx.objectStore(STORE_NAME).put({ text, cachedAt: Date.now() }, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        // Silently fail — cache is optional
    }
}
