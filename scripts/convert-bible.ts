#!/usr/bin/env node
/**
 * convert-bible.ts
 * Converts thiagobodruk/bible JSON format to per-book files used by Miracle Memory.
 *
 * Input:  public/bible/raw/{lang}.json
 * Output: public/bible/{lang}/{bookId}.json
 *
 * Raw format: [{abbrev, chapters: [[verse1, verse2, ...], ...]}, ...]
 * Output format: { bookId, bookName, chapters: { "1": { "1": "text", "2": "text" }, ... } }
 */

import fs from "fs";
import path from "path";

// Maps thiagobodruk abbrev → our canonical book ID
const BOOK_MAP: Record<string, { id: string; nameEn: string; testament: "OT" | "NT" }> = {
    gn: { id: "genesis", nameEn: "Genesis", testament: "OT" },
    ex: { id: "exodus", nameEn: "Exodus", testament: "OT" },
    lv: { id: "leviticus", nameEn: "Leviticus", testament: "OT" },
    nm: { id: "numbers", nameEn: "Numbers", testament: "OT" },
    dt: { id: "deuteronomy", nameEn: "Deuteronomy", testament: "OT" },
    js: { id: "joshua", nameEn: "Joshua", testament: "OT" },
    jud: { id: "judges", nameEn: "Judges", testament: "OT" },
    rt: { id: "ruth", nameEn: "Ruth", testament: "OT" },
    "1sm": { id: "1samuel", nameEn: "1 Samuel", testament: "OT" },
    "2sm": { id: "2samuel", nameEn: "2 Samuel", testament: "OT" },
    "1kgs": { id: "1kings", nameEn: "1 Kings", testament: "OT" },
    "2kgs": { id: "2kings", nameEn: "2 Kings", testament: "OT" },
    "1ch": { id: "1chronicles", nameEn: "1 Chronicles", testament: "OT" },
    "2ch": { id: "2chronicles", nameEn: "2 Chronicles", testament: "OT" },
    ez: { id: "ezra", nameEn: "Ezra", testament: "OT" },
    ne: { id: "nehemiah", nameEn: "Nehemiah", testament: "OT" },
    et: { id: "esther", nameEn: "Esther", testament: "OT" },
    jb: { id: "job", nameEn: "Job", testament: "OT" },
    ps: { id: "psalms", nameEn: "Psalms", testament: "OT" },
    prv: { id: "proverbs", nameEn: "Proverbs", testament: "OT" },
    ec: { id: "ecclesiastes", nameEn: "Ecclesiastes", testament: "OT" },
    sg: { id: "songofsolomon", nameEn: "Song of Solomon", testament: "OT" },
    is: { id: "isaiah", nameEn: "Isaiah", testament: "OT" },
    jr: { id: "jeremiah", nameEn: "Jeremiah", testament: "OT" },
    lm: { id: "lamentations", nameEn: "Lamentations", testament: "OT" },
    ez2: { id: "ezekiel", nameEn: "Ezekiel", testament: "OT" },
    dn: { id: "daniel", nameEn: "Daniel", testament: "OT" },
    ho: { id: "hosea", nameEn: "Hosea", testament: "OT" },
    jl: { id: "joel", nameEn: "Joel", testament: "OT" },
    am: { id: "amos", nameEn: "Amos", testament: "OT" },
    ob: { id: "obadiah", nameEn: "Obadiah", testament: "OT" },
    jn2: { id: "jonah", nameEn: "Jonah", testament: "OT" },
    mi: { id: "micah", nameEn: "Micah", testament: "OT" },
    na: { id: "nahum", nameEn: "Nahum", testament: "OT" },
    hk: { id: "habakkuk", nameEn: "Habakkuk", testament: "OT" },
    zp: { id: "zephaniah", nameEn: "Zephaniah", testament: "OT" },
    hg: { id: "haggai", nameEn: "Haggai", testament: "OT" },
    zc: { id: "zechariah", nameEn: "Zechariah", testament: "OT" },
    ml: { id: "malachi", nameEn: "Malachi", testament: "OT" },
    mt: { id: "matthew", nameEn: "Matthew", testament: "NT" },
    mk: { id: "mark", nameEn: "Mark", testament: "NT" },
    lk: { id: "luke", nameEn: "Luke", testament: "NT" },
    jn: { id: "john", nameEn: "John", testament: "NT" },
    act: { id: "acts", nameEn: "Acts", testament: "NT" },
    rm: { id: "romans", nameEn: "Romans", testament: "NT" },
    "1co": { id: "1corinthians", nameEn: "1 Corinthians", testament: "NT" },
    "2co": { id: "2corinthians", nameEn: "2 Corinthians", testament: "NT" },
    gl: { id: "galatians", nameEn: "Galatians", testament: "NT" },
    eph: { id: "ephesians", nameEn: "Ephesians", testament: "NT" },
    ph: { id: "philippians", nameEn: "Philippians", testament: "NT" },
    cl: { id: "colossians", nameEn: "Colossians", testament: "NT" },
    "1ts": { id: "1thessalonians", nameEn: "1 Thessalonians", testament: "NT" },
    "2ts": { id: "2thessalonians", nameEn: "2 Thessalonians", testament: "NT" },
    "1tm": { id: "1timothy", nameEn: "1 Timothy", testament: "NT" },
    "2tm": { id: "2timothy", nameEn: "2 Timothy", testament: "NT" },
    tt: { id: "titus", nameEn: "Titus", testament: "NT" },
    phm: { id: "philemon", nameEn: "Philemon", testament: "NT" },
    hb: { id: "hebrews", nameEn: "Hebrews", testament: "NT" },
    jm: { id: "james", nameEn: "James", testament: "NT" },
    "1pe": { id: "1peter", nameEn: "1 Peter", testament: "NT" },
    "2pe": { id: "2peter", nameEn: "2 Peter", testament: "NT" },
    "1jo": { id: "1john", nameEn: "1 John", testament: "NT" },
    "2jo": { id: "2john", nameEn: "2 John", testament: "NT" },
    "3jo": { id: "3john", nameEn: "3 John", testament: "NT" },
    jd: { id: "jude", nameEn: "Jude", testament: "NT" },
    re: { id: "revelation", nameEn: "Revelation", testament: "NT" },
};

interface RawBook {
    abbrev: string;
    chapters: string[][];
}

interface BookOutput {
    bookId: string;
    nameEn: string;
    testament: "OT" | "NT";
    totalChapters: number;
    chapters: Record<string, Record<string, string>>; // { "1": { "1": "...", "2": "..." } }
}

const LANGS = ["en", "ko", "zh", "de", "es", "fr"];
const RAW_DIR = path.join(process.cwd(), "public", "bible", "raw");
const OUT_DIR = path.join(process.cwd(), "public", "bible");

// Abbreviation fix map for different languages (some have different abbrevs)
function normalizeAbbrev(abbrev: string): string {
    const lower = abbrev.toLowerCase().trim();
    // Handle ezekiel collision with ezra
    // (some versions use "ez" for both — we detect by index)
    return lower;
}

function convertLang(lang: string) {
    const rawPath = path.join(RAW_DIR, `${lang}.json`);
    if (!fs.existsSync(rawPath)) {
        console.warn(`⚠️  Missing raw file: ${rawPath}`);
        return;
    }

    const raw: RawBook[] = JSON.parse(fs.readFileSync(rawPath, "utf-8").replace(/^\uFEFF/, ""));
    const outLangDir = path.join(OUT_DIR, lang);
    fs.mkdirSync(outLangDir, { recursive: true });

    // Process sequentially using index to handle duplicate abbrevs (e.g. ez/ez2)
    const BOOK_IDS_BY_INDEX = Object.values(BOOK_MAP);

    let totalVerses = 0;
    let booksWritten = 0;

    raw.forEach((rawBook, idx) => {
        if (idx >= BOOK_IDS_BY_INDEX.length) return;

        const bookMeta = BOOK_IDS_BY_INDEX[idx];
        const chapters: Record<string, Record<string, string>> = {};

        rawBook.chapters.forEach((chapterVerses, chIdx) => {
            const chNum = String(chIdx + 1);
            chapters[chNum] = {};
            chapterVerses.forEach((text, vIdx) => {
                // Clean up trailing "!" markers in some versions
                const clean = text.replace(/ !/g, "").trim();
                chapters[chNum][String(vIdx + 1)] = clean;
                totalVerses++;
            });
        });

        const output: BookOutput = {
            bookId: bookMeta.id,
            nameEn: bookMeta.nameEn,
            testament: bookMeta.testament,
            totalChapters: rawBook.chapters.length,
            chapters,
        };

        const outPath = path.join(outLangDir, `${bookMeta.id}.json`);
        fs.writeFileSync(outPath, JSON.stringify(output));
        booksWritten++;
    });

    console.log(`✅ [${lang}] ${booksWritten} books, ${totalVerses.toLocaleString()} verses`);
}

// Also generate a book index (for the UI to list all 66 books)
function generateIndex() {
    const index = Object.values(BOOK_MAP).map((b, idx) => ({
        id: b.id,
        nameEn: b.nameEn,
        testament: b.testament,
        order: idx + 1,
    }));
    fs.writeFileSync(
        path.join(OUT_DIR, "index.json"),
        JSON.stringify(index, null, 2)
    );
    console.log(`📖 index.json generated (${index.length} books)`);
}

console.log("🔄 Converting Bible JSON data...\n");
LANGS.forEach(convertLang);
generateIndex();
console.log("\n✨ Done! Files in public/bible/");
