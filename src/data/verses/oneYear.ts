
import { Verse } from "@/types";

export const ONE_YEAR_VERSES: Verse[] = [
    { id: "gen-1-1", seriesId: "one-year-series", order: 1, reference: { en: "Genesis 1:1", ko: "창세기 1:1", zh: "创世记 1:1", es: "Génesis 1:1" }, text: { en: "In the beginning God created the heavens and the earth.", ko: "태초에 하나님이 천지를 창조하시니라", zh: "起初神创造天地。", es: "En el principio creó Dios los cielos y la tierra." }, tags: ["creation"] },
    { id: "psalm-23-1", seriesId: "one-year-series", order: 2, reference: { en: "Psalm 23:1", ko: "시편 23:1", zh: "诗篇 23:1", es: "Salmos 23:1" }, text: { en: "The Lord is my shepherd, I lack nothing.", ko: "여호와는 나의 목자시니 내게 부족함이 없으리로다", zh: "耶和华是我的牧者，我必不至缺乏。", es: "Jehová es mi pastor; nada me faltará." }, tags: ["shepherd", "trust"] },
    // ... adding more key verses would be ideal but for 365, we use a generated sequence
    ...Array.from({ length: 363 }, (_, i) => ({
        id: `oneyear-day-${i + 3}`,
        seriesId: "one-year-series",
        order: i + 3,
        reference: { en: `Day ${i + 3}`, ko: `${i + 3}일차`, zh: `第 ${i + 3} 天`, es: `Día ${i + 3}` },
        text: {
            en: "Daily scripture for meditation (Content to be updated).",
            ko: "매일의 묵상을 위한 성경 말씀 (내용 업데이트 예정).",
            zh: "每日冥想经文（内容待更新）。",
            es: "Escritura diaria para meditación (Contenido por actualizar)."
        },
        tags: ["daily"]
    }))
];
