"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Correct import for App Router
import { INITIAL_SERIES, VERSES } from "@/data/seedData";
import { Series, Verse } from "@/types";

export default function SeriesPrintPage() {
    // In Next.js App Router, params are passed directly to the page component
    // No need to use useParams() hook for main page components usually, 
    // but ensuring we handle it robustly.
    const params = useParams();
    const id = params?.id as string;

    const [series, setSeries] = useState<Series | null>(null);
    const [courseVerses, setCourseVerses] = useState<Verse[]>([]);
    const [language, setLanguage] = useState<'en' | 'ko' | 'zh' | 'es'>('en'); // Default to English

    useEffect(() => {
        // Hydrate from local storage if available, or just default to EN
        const saved = localStorage.getItem('app-language') as 'en' | 'ko' | 'zh' | 'es';
        if (saved) setLanguage(saved);
    }, []);

    useEffect(() => {
        if (!id) return;

        const foundSeries = INITIAL_SERIES.find(s => s.id === id);
        const relativeVerses = VERSES
            .filter(v => v.seriesId === id)
            .sort((a, b) => a.order - b.order);

        if (foundSeries) setSeries(foundSeries);
        setCourseVerses(relativeVerses);
    }, [id]);

    if (!series) return <div className="p-10 text-center">Loading Series...</div>;

    const printPage = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white text-black p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
            {/* Control Bar - Hidden when printing */}
            <div className="print:hidden mb-8 flex justify-between items-center bg-stone-100 p-4 rounded-xl">
                <div>
                    <label className="mr-4 font-bold text-sm">Language / 언어:</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="p-2 rounded border border-stone-300"
                    >
                        <option value="en">English</option>
                        <option value="ko">Korean (한국어)</option>
                        <option value="zh">Chinese (中文)</option>
                        <option value="es">Spanish (Español)</option>
                    </select>
                </div>
                <button
                    onClick={printPage}
                    className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print / PDF
                </button>
            </div>

            {/* Print Content */}
            <header className="text-center mb-10 border-b-2 border-black pb-6">
                <h1 className="text-3xl font-serif font-bold mb-2">{series.title[language]}</h1>
                <p className="text-stone-600 italic">{series.description[language]}</p>
                <div className="mt-4 text-xs text-stone-400 uppercase tracking-widest">Kingdom Memory Series</div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {courseVerses.map((verse) => (
                    <div key={verse.id} className="break-inside-avoid border-b border-dashed border-stone-300 pb-4 mb-2">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="font-bold text-xl font-serif">#{verse.order}</span>
                            <span className="font-bold text-stone-600">{verse.reference[language]}</span>
                        </div>
                        <p className="text-lg leading-relaxed font-serif text-justify">
                            {verse.text[language]}
                        </p>
                        {/* Optional: Show English if Korean is selected for bilingual view, usually helpful for study */}
                        {language === 'ko' && (
                            <p className="text-sm text-stone-400 mt-2 font-serif italic">
                                {verse.text.en}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <footer className="mt-12 text-center text-xs text-stone-400 print:fixed print:bottom-4 print:left-0 print:w-full">
                © {new Date().getFullYear()} Kingdom Memory - {series.title.en}
            </footer>
        </div>
    );
}
