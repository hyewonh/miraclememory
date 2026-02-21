"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/context/LanguageContext";
import { useBibleIndex, useBibleBook } from "@/hooks/useBible";
import { useCustomSeries } from "@/hooks/useCustomSeries";
import { BookIndex, BOOK_NAMES_KO } from "@/types/bible";
import { Navbar } from "@/components/layout/Navbar";
import { CustomVerseRef } from "@/hooks/useCustomSeries";
import { UI_TEXT } from "@/data/translations";

type MobileStep = "books" | "chapters" | "verses";

// ─── Book names per language ─────────────────────────────────────
const BOOK_NAMES: Record<string, Record<string, string>> = {
    ko: BOOK_NAMES_KO,
    zh: { genesis: "创世记", exodus: "出埃及记", leviticus: "利未记", numbers: "民数记", deuteronomy: "申命记", joshua: "约书亚记", judges: "士师记", ruth: "路得记", "1samuel": "撒母耳记上", "2samuel": "撒母耳记下", "1kings": "列王纪上", "2kings": "列王纪下", "1chronicles": "历代志上", "2chronicles": "历代志下", ezra: "以斯拉记", nehemiah: "尼希米记", esther: "以斯帖记", job: "约伯记", psalms: "诗篇", proverbs: "箴言", ecclesiastes: "传道书", songofsolomon: "雅歌", isaiah: "以赛亚书", jeremiah: "耶利米书", lamentations: "耶利米哀歌", ezekiel: "以西结书", daniel: "但以理书", hosea: "何西阿书", joel: "约珥书", amos: "阿摩司书", obadiah: "俄巴底亚书", jonah: "约拿书", micah: "弥迦书", nahum: "那鸿书", habakkuk: "哈巴谷书", zephaniah: "西番雅书", haggai: "哈该书", zechariah: "撒迦利亚书", malachi: "玛拉基书", matthew: "马太福音", mark: "马可福音", luke: "路加福音", john: "约翰福音", acts: "使徒行传", romans: "罗马书", "1corinthians": "哥林多前书", "2corinthians": "哥林多后书", galatians: "加拉太书", ephesians: "以弗所书", philippians: "腓立比书", colossians: "歌罗西书", "1thessalonians": "帖撒罗尼迦前书", "2thessalonians": "帖撒罗尼迦后书", "1timothy": "提摩太前书", "2timothy": "提摩太后书", titus: "提多书", philemon: "腓利门书", hebrews: "希伯来书", james: "雅各书", "1peter": "彼得前书", "2peter": "彼得后书", "1john": "约翰一书", "2john": "约翰二书", "3john": "约翰三书", jude: "犹大书", revelation: "启示录" },
    es: { genesis: "Génesis", exodus: "Éxodo", leviticus: "Levítico", numbers: "Números", deuteronomy: "Deuteronomio", joshua: "Josué", judges: "Jueces", ruth: "Rut", "1samuel": "1 Samuel", "2samuel": "2 Samuel", "1kings": "1 Reyes", "2kings": "2 Reyes", "1chronicles": "1 Crónicas", "2chronicles": "2 Crónicas", ezra: "Esdras", nehemiah: "Nehemías", esther: "Ester", job: "Job", psalms: "Salmos", proverbs: "Proverbios", ecclesiastes: "Eclesiastés", songofsolomon: "Cantares", isaiah: "Isaías", jeremiah: "Jeremías", lamentations: "Lamentaciones", ezekiel: "Ezequiel", daniel: "Daniel", hosea: "Oseas", joel: "Joel", amos: "Amós", obadiah: "Abdías", jonah: "Jonás", micah: "Miqueas", nahum: "Nahúm", habakkuk: "Habacuc", zephaniah: "Sofonías", haggai: "Hageo", zechariah: "Zacarías", malachi: "Malaquías", matthew: "Mateo", mark: "Marcos", luke: "Lucas", john: "Juan", acts: "Hechos", romans: "Romanos", "1corinthians": "1 Corintios", "2corinthians": "2 Corintios", galatians: "Gálatas", ephesians: "Efesios", philippians: "Filipenses", colossians: "Colosenses", "1thessalonians": "1 Tesalonicenses", "2thessalonians": "2 Tesalonicenses", "1timothy": "1 Timoteo", "2timothy": "2 Timoteo", titus: "Tito", philemon: "Filemón", hebrews: "Hebreos", james: "Santiago", "1peter": "1 Pedro", "2peter": "2 Pedro", "1john": "1 Juan", "2john": "2 Juan", "3john": "3 Juan", jude: "Judas", revelation: "Apocalipsis" },
    de: { genesis: "1. Mose", exodus: "2. Mose", leviticus: "3. Mose", numbers: "4. Mose", deuteronomy: "5. Mose", joshua: "Josua", judges: "Richter", ruth: "Ruth", "1samuel": "1. Samuel", "2samuel": "2. Samuel", "1kings": "1. Könige", "2kings": "2. Könige", "1chronicles": "1. Chronik", "2chronicles": "2. Chronik", ezra: "Esra", nehemiah: "Nehemia", esther: "Ester", job: "Hiob", psalms: "Psalmen", proverbs: "Sprüche", ecclesiastes: "Prediger", songofsolomon: "Hohelied", isaiah: "Jesaja", jeremiah: "Jeremia", lamentations: "Klagelieder", ezekiel: "Hesekiel", daniel: "Daniel", hosea: "Hosea", joel: "Joel", amos: "Amos", obadiah: "Obadja", jonah: "Jona", micah: "Micha", nahum: "Nahum", habakkuk: "Habakuk", zephaniah: "Zephanja", haggai: "Haggai", zechariah: "Sacharja", malachi: "Maleachi", matthew: "Matthäus", mark: "Markus", luke: "Lukas", john: "Johannes", acts: "Apostelgeschichte", romans: "Römer", "1corinthians": "1. Korinther", "2corinthians": "2. Korinther", galatians: "Galater", ephesians: "Epheser", philippians: "Philipper", colossians: "Kolosser", "1thessalonians": "1. Thessalonicher", "2thessalonians": "2. Thessalonicher", "1timothy": "1. Timotheus", "2timothy": "2. Timotheus", titus: "Titus", philemon: "Philemon", hebrews: "Hebräer", james: "Jakobus", "1peter": "1. Petrus", "2peter": "2. Petrus", "1john": "1. Johannes", "2john": "2. Johannes", "3john": "3. Johannes", jude: "Judas", revelation: "Offenbarung" },
    fr: { genesis: "Genèse", exodus: "Exode", leviticus: "Lévitique", numbers: "Nombres", deuteronomy: "Deutéronome", joshua: "Josué", judges: "Juges", ruth: "Ruth", "1samuel": "1 Samuel", "2samuel": "2 Samuel", "1kings": "1 Rois", "2kings": "2 Rois", "1chronicles": "1 Chroniques", "2chronicles": "2 Chroniques", ezra: "Esdras", nehemiah: "Néhémie", esther: "Esther", job: "Job", psalms: "Psaumes", proverbs: "Proverbes", ecclesiastes: "Ecclésiaste", songofsolomon: "Cantique", isaiah: "Ésaïe", jeremiah: "Jérémie", lamentations: "Lamentations", ezekiel: "Ézéchiel", daniel: "Daniel", hosea: "Osée", joel: "Joël", amos: "Amos", obadiah: "Abdias", jonah: "Jonas", micah: "Michée", nahum: "Nahum", habakkuk: "Habaquq", zephaniah: "Sophonie", haggai: "Aggée", zechariah: "Zacharie", malachi: "Malachie", matthew: "Matthieu", mark: "Marc", luke: "Luc", john: "Jean", acts: "Actes", romans: "Romains", "1corinthians": "1 Corinthiens", "2corinthians": "2 Corinthiens", galatians: "Galates", ephesians: "Éphésiens", philippians: "Philippiens", colossians: "Colossiens", "1thessalonians": "1 Thessaloniciens", "2thessalonians": "2 Thessaloniciens", "1timothy": "1 Timothée", "2timothy": "2 Timothée", titus: "Tite", philemon: "Philémon", hebrews: "Hébreux", james: "Jacques", "1peter": "1 Pierre", "2peter": "2 Pierre", "1john": "1 Jean", "2john": "2 Jean", "3john": "3 Jean", jude: "Jude", revelation: "Apocalypse" },
};

function getBookName(book: BookIndex, lang: string): string {
    if (lang !== "en" && BOOK_NAMES[lang]?.[book.id]) return BOOK_NAMES[lang][book.id];
    return book.nameEn;
}

// ─── Premium gate ────────────────────────────────────────────────
function PremiumLock({ onUpgrade, lang }: { onUpgrade: () => void; lang: string }) {
    const t = UI_TEXT.bible;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="text-5xl mb-4">👑</div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">{t.premiumTitle[lang as keyof typeof t.premiumTitle]}</h2>
                <p className="text-stone-500 mb-6 leading-relaxed">{t.premiumDesc[lang as keyof typeof t.premiumDesc]}</p>
                <button onClick={onUpgrade} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-amber-400/30">
                    {t.premiumCta[lang as keyof typeof t.premiumCta]}
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function BiblePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { profile } = useProfile();
    const { language } = useLanguage();
    const isPremium = profile?.isPremium ?? false;
    const t = UI_TEXT.bible;
    const tl = (obj: Record<string, string>) => obj[language] ?? obj["en"];

    const { books, loading: booksLoading } = useBibleIndex();
    const [selectedBook, setSelectedBook] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [testament, setTestament] = useState<"OT" | "NT">("NT");
    const [searchQuery, setSearchQuery] = useState("");
    const [showPremiumGate, setShowPremiumGate] = useState(false);
    // Mobile: step-by-step navigation
    const [mobileStep, setMobileStep] = useState<MobileStep>("books");

    const { createSeries, addVerse } = useCustomSeries();
    const [selectedVerses, setSelectedVerses] = useState<CustomVerseRef[]>([]);
    const [showSeriesModal, setShowSeriesModal] = useState(false);
    const [newSeriesTitle, setNewSeriesTitle] = useState("");
    const [newSeriesDesc, setNewSeriesDesc] = useState("");

    const { data: bookData, loading: bookLoading } = useBibleBook(selectedBook);

    const otBooks = books.filter(b => b.testament === "OT");
    const ntBooks = books.filter(b => b.testament === "NT");
    const displayBooks = testament === "OT" ? otBooks : ntBooks;

    const selectedBookMeta = books.find(b => b.id === selectedBook);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim() || !bookData) return [];
        const q = searchQuery.toLowerCase();
        const results: { ch: number; v: number; text: string }[] = [];
        Object.entries(bookData.chapters).forEach(([ch, verses]) => {
            Object.entries(verses).forEach(([v, text]) => {
                if (text.toLowerCase().includes(q)) results.push({ ch: Number(ch), v: Number(v), text });
            });
        });
        return results.slice(0, 50);
    }, [searchQuery, bookData]);

    const handleBookSelect = (bookId: string) => {
        setSelectedBook(bookId);
        setSelectedChapter(null);
        setSearchQuery("");
        setMobileStep("chapters");
    };

    const handleChapterSelect = (ch: number) => {
        setSelectedChapter(ch);
        setSearchQuery("");
        setMobileStep("verses");
    };

    const handleVerseToggle = (ch: number, v: number, text: string) => {
        if (!isPremium) { setShowPremiumGate(true); return; }
        const id = `${selectedBook}-${ch}-${v}`;
        const existing = selectedVerses.find(sv => sv.id === id);
        if (existing) {
            setSelectedVerses(prev => prev.filter(sv => sv.id !== id));
        } else {
            const bookLabel = selectedBookMeta ? getBookName(selectedBookMeta, language) : selectedBook ?? "";
            setSelectedVerses(prev => [...prev, {
                id, bookId: selectedBook!, chapter: ch, verse: v,
                text: { [language]: text },
                reference: { [language]: `${bookLabel} ${ch}:${v}` },
            }]);
        }
    };

    const handleCreateSeries = async () => {
        if (!newSeriesTitle.trim()) return;
        const id = await createSeries(newSeriesTitle, newSeriesDesc);
        if (id) for (const v of selectedVerses) await addVerse(id, v);
        setSelectedVerses([]); setNewSeriesTitle(""); setNewSeriesDesc("");
        setShowSeriesModal(false);
        router.push("/profile");
    };

    // ── Sub-components ──────────────────────────────────────────
    const BookList = () => (
        <div className="flex-1 overflow-y-auto">
            {/* Testament tabs */}
            <div className="flex border-b border-stone-100 sticky top-0 bg-white z-10">
                {(["NT", "OT"] as const).map(tp => (
                    <button key={tp} onClick={() => setTestament(tp)}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${testament === tp ? "bg-amber-500 text-white" : "text-stone-400 hover:text-stone-700"}`}>
                        {tp === "NT" ? tl(t.newTestament) : tl(t.oldTestament)}
                    </button>
                ))}
            </div>
            <div className="divide-y divide-stone-50">
                {booksLoading ? (
                    <div className="p-8 text-center text-stone-300 text-sm">loading...</div>
                ) : displayBooks.map(book => (
                    <button key={book.id} onClick={() => handleBookSelect(book.id)}
                        className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-all flex items-center justify-between ${selectedBook === book.id ? "bg-amber-50 text-amber-700" : "text-stone-700 hover:bg-stone-50"
                            }`}>
                        <span>{getBookName(book, language)}</span>
                        <svg className="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                ))}
            </div>
        </div>
    );

    const ChapterList = () => (
        <div className="flex-1 overflow-y-auto">
            {/* Search for premium */}
            {selectedBook && (
                <div className="p-3 border-b border-stone-100 sticky top-0 bg-white z-10">
                    <input type="text"
                        placeholder={isPremium ? tl(t.searchPlaceholder) : tl(t.searchLocked)}
                        value={searchQuery}
                        onFocus={() => { if (!isPremium) setShowPremiumGate(true); }}
                        onChange={e => { if (isPremium) setSearchQuery(e.target.value); }}
                        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-stone-400"
                    />
                </div>
            )}
            {bookLoading ? (
                <div className="p-8 text-center text-stone-300 text-sm">loading...</div>
            ) : bookData ? (
                <div className="grid grid-cols-5 md:grid-cols-1 gap-1 p-3 md:p-0 md:divide-y md:divide-stone-50">
                    {Array.from({ length: bookData.totalChapters }, (_, i) => i + 1).map(ch => (
                        <button key={ch} onClick={() => handleChapterSelect(ch)}
                            className={`py-3 md:py-3.5 rounded-xl md:rounded-none text-sm font-medium transition-all md:px-5 md:text-left md:flex md:items-center md:justify-between ${selectedChapter === ch
                                    ? "bg-amber-500 text-white md:bg-amber-50 md:text-amber-700"
                                    : "bg-stone-50 text-stone-600 md:bg-transparent hover:bg-amber-50 md:hover:bg-stone-50"
                                }`}>
                            {ch}{tl(t.chapterLabel)}
                            <svg className="hidden md:block w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );

    const VerseList = () => (
        <div className="flex-1 overflow-y-auto">
            {/* Selection bar */}
            {isPremium && selectedVerses.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-100 sticky top-0 z-10">
                    <span className="text-amber-700 text-sm font-bold">{selectedVerses.length} {tl(t.verseSelected)}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedVerses([])} className="text-stone-400 text-xs hover:text-stone-600 px-2">{tl(t.clearSelection)}</button>
                        <button onClick={() => setShowSeriesModal(true)} className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 py-1.5 rounded-lg">{tl(t.createSeries)}</button>
                    </div>
                </div>
            )}
            <div className="p-4 space-y-1">
                {searchQuery && searchResults.length > 0 ? (
                    <>
                        <p className="text-xs text-stone-400 mb-3">{searchResults.length} {tl(t.results)}</p>
                        {searchResults.map(r => {
                            const id = `${selectedBook}-${r.ch}-${r.v}`;
                            const isSel = selectedVerses.some(v => v.id === id);
                            return (
                                <div key={id} onClick={() => handleVerseToggle(r.ch, r.v, r.text)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSel ? "bg-amber-50 border-amber-300" : "border-stone-100 hover:border-amber-200"}`}>
                                    <span className="text-xs font-bold text-amber-600 mr-2">{r.ch}:{r.v}</span>
                                    <span className="text-sm text-stone-700 leading-relaxed">{r.text}</span>
                                </div>
                            );
                        })}
                    </>
                ) : searchQuery ? (
                    <div className="text-center text-stone-300 text-sm py-10">{tl(t.noResults)}</div>
                ) : selectedChapter && bookData ? (
                    Object.entries(bookData.chapters[String(selectedChapter)] || {}).map(([vNum, text]) => {
                        const id = `${selectedBook}-${selectedChapter}-${vNum}`;
                        const isSel = selectedVerses.some(v => v.id === id);
                        return (
                            <div key={vNum} onClick={() => handleVerseToggle(selectedChapter, Number(vNum), text)}
                                className={`flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all group ${isSel ? "bg-amber-50 border-amber-300" : "border-transparent hover:bg-stone-50"}`}>
                                <span className="text-amber-500 font-bold text-sm w-7 flex-shrink-0 mt-0.5">{vNum}</span>
                                <span className="text-stone-700 text-sm leading-relaxed flex-1">{text}</span>
                                {isPremium && (
                                    <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-all ${isSel ? "bg-amber-500 border-amber-500" : "border-stone-200 group-hover:border-amber-400"}`} />
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center text-stone-300">
                        <div className="text-4xl mb-2">📖</div>
                        <p className="text-sm">{tl(t.tapChapter)}</p>
                        {!isPremium && selectedBook && (
                            <button onClick={() => setShowPremiumGate(true)} className="mt-3 text-xs bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold hover:bg-amber-200">
                                {tl(t.premiumBadge)}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            <Navbar />

            {showPremiumGate && (
                <PremiumLock lang={language} onUpgrade={() => { setShowPremiumGate(false); router.push("/#pricing"); }} />
            )}

            {/* ═══════════════════ MOBILE LAYOUT ═══════════════════ */}
            <div className="md:hidden flex flex-col h-[calc(100vh-80px)]">
                {/* Mobile header with breadcrumb */}
                <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
                    {mobileStep !== "books" && (
                        <button onClick={() => {
                            if (mobileStep === "verses") setMobileStep("chapters");
                            else { setMobileStep("books"); setSelectedBook(null); }
                        }} className="p-1.5 -ml-1.5 text-stone-500 hover:text-stone-800">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-bold text-stone-900 truncate">
                            {mobileStep === "books" && tl(t.pageTitle)}
                            {mobileStep === "chapters" && selectedBookMeta && getBookName(selectedBookMeta, language)}
                            {mobileStep === "verses" && selectedBookMeta && `${getBookName(selectedBookMeta, language)} ${selectedChapter}${tl(t.chapterLabel)}`}
                        </h1>
                        {mobileStep === "books" && (
                            <p className="text-xs text-stone-400">66 books</p>
                        )}
                    </div>
                </div>

                {/* Mobile step content */}
                <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    {mobileStep === "books" && <BookList />}
                    {mobileStep === "chapters" && <ChapterList />}
                    {mobileStep === "verses" && <VerseList />}
                </div>
            </div>

            {/* ═══════════════════ DESKTOP LAYOUT ═══════════════════ */}
            <main className="hidden md:flex flex-col flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pt-6 pb-10">
                <div className="mb-5">
                    <h1 className="text-3xl font-bold text-stone-900">{tl(t.pageTitle)}</h1>
                    <p className="text-stone-400 mt-1 text-sm">{tl(t.pageSubtitle)}</p>
                </div>
                <div className="flex gap-4 flex-1" style={{ height: "calc(100vh - 230px)" }}>
                    {/* Book list */}
                    <div className="w-52 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden">
                        <BookList />
                    </div>
                    {/* Chapter list */}
                    <div className="w-44 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden">
                        {selectedBook ? <ChapterList /> : (
                            <div className="flex-1 flex items-center justify-center text-stone-300 text-xs text-center px-4">{tl(t.selectBook)}</div>
                        )}
                    </div>
                    {/* Verse list */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden">
                        {selectedChapter || searchQuery ? <VerseList /> : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-300 gap-2">
                                <div className="text-5xl">📖</div>
                                <p className="text-sm">{selectedBook ? tl(t.tapChapter) : tl(t.selectChapter)}</p>
                                {!isPremium && selectedBook && (
                                    <button onClick={() => setShowPremiumGate(true)} className="mt-2 text-xs bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold hover:bg-amber-200">{tl(t.premiumBadge)}</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Create Series Modal */}
            {showSeriesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-stone-900 mb-1">{tl(t.customSeriesTitle)}</h2>
                        <p className="text-stone-400 text-sm mb-5">{selectedVerses.length} {tl(t.customSeriesVerseCount)}</p>
                        <input type="text" placeholder={tl(t.seriesNamePlaceholder)} value={newSeriesTitle}
                            onChange={e => setNewSeriesTitle(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                        <textarea placeholder={tl(t.seriesDescPlaceholder)} value={newSeriesDesc}
                            onChange={e => setNewSeriesDesc(e.target.value)} rows={2}
                            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm mb-5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowSeriesModal(false)} className="flex-1 border border-stone-200 text-stone-500 font-bold py-3 rounded-xl hover:bg-stone-50">{tl(t.cancel)}</button>
                            <button onClick={handleCreateSeries} disabled={!newSeriesTitle.trim()}
                                className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-40 shadow-lg shadow-amber-400/30">{tl(t.create)}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
