"use client";
import { useState, useEffect } from "react";
import { BookData, BookIndex } from "@/types/bible";
import { useLanguage } from "@/context/LanguageContext";

// Cache loaded books in memory to avoid refetching on language switch
const bookCache: Record<string, BookData> = {};

export function useBibleIndex() {
    const [books, setBooks] = useState<BookIndex[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/bible/index.json")
            .then(r => r.json())
            .then(data => { setBooks(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return { books, loading };
}

export function useBibleBook(bookId: string | null) {
    const { language } = useLanguage();
    const [data, setData] = useState<BookData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!bookId) { setData(null); return; }

        const cacheKey = `${language}:${bookId}`;
        if (bookCache[cacheKey]) {
            setData(bookCache[cacheKey]);
            return;
        }

        setLoading(true);
        fetch(`/bible/${language}/${bookId}.json`)
            .then(r => r.json())
            .then((d: BookData) => {
                bookCache[cacheKey] = d;
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [bookId, language]);

    return { data, loading };
}
