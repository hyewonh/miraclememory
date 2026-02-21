// useLiveBibleText — fetches verse text from API (cache-first)
// Falls back to hard-coded text if API is unavailable
import { useState, useEffect } from "react";
import { fetchVerseText } from "@/lib/bibleApi";

interface UseLiveBibleTextOptions {
    reference: string;   // English reference, e.g. "Romans 1:16"
    language: string;    // "en" | "ko" | "zh" | "es" | "de" | "fr"
    fallback: string;    // Hard-coded text from verses/*.ts — shown while loading
}

interface UseLiveBibleTextResult {
    text: string;        // Current text to display (fallback → live)
    isLive: boolean;     // Whether text is from API (vs. fallback)
    isLoading: boolean;
}

export function useLiveBibleText({
    reference,
    language,
    fallback,
}: UseLiveBibleTextOptions): UseLiveBibleTextResult {
    const [text, setText] = useState<string>(fallback);
    const [isLive, setIsLive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Reset to fallback on verse/language change
        setText(fallback);
        setIsLive(false);
        setIsLoading(true);

        let cancelled = false;

        const load = async () => {
            const liveText = await fetchVerseText(reference, language);
            if (cancelled) return;

            if (liveText && liveText.trim().length > 10) {
                setText(liveText);
                setIsLive(true);
            }
            setIsLoading(false);
        };

        load();
        return () => { cancelled = true; };
    }, [reference, language, fallback]);

    return { text, isLive, isLoading };
}
