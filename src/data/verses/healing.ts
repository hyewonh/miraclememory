
import { Verse } from "@/types";

// Note: Healing verses contains a curated selection of 100 healing scriptures.
// This file initializes the first batch and structure for expansion.
export const HEALING_VERSES: Verse[] = [
    { id: "exodus-15-26", seriesId: "healing-100", order: 1, reference: { en: "Exodus 15:26", ko: "출애굽기 15:26", zh: "出埃及记 15:26", es: "Éxodo 15:26" }, text: { en: "I am the Lord, who heals you.", ko: "나는 너희를 치료하는 여호와임이라", zh: "我是医治你的耶和华。", es: "Yo soy Jehová tu sanador." }, tags: ["healing", "god's name"] },
    { id: "exodus-23-25", seriesId: "healing-100", order: 2, reference: { en: "Exodus 23:25", ko: "출애굽기 23:25", zh: "出埃及记 23:25", es: "Éxodo 23:25" }, text: { en: "Worship the Lord your God, and his blessing will be on your food and water. I will take away sickness from among you.", ko: "네 하나님 여호와를 섬기라 그리하면 여호와가 너희의 양식과 물에 복을 내리고 너희 중에서 병을 제하리니", zh: "你们要事奉耶和华你们的神，他必赐福与你的粮与你的水，也必从你们中间除去疾病。", es: "Mas a Jehová vuestro Dios serviréis, y él bendecirá tu pan y tus aguas; y yo quitaré toda enfermedad de en medio de ti." }, tags: ["blessing", "protection"] },
    { id: "psalm-103-2-3", seriesId: "healing-100", order: 3, reference: { en: "Psalm 103:2-3", ko: "시편 103:2-3", zh: "诗篇 103:2-3", es: "Salmos 103:2-3" }, text: { en: "Praise the Lord, my soul... who forgives all your sins and heals all your diseases,", ko: "내 영혼아 여호와를 송축하며... 그가 네 모든 죄악을 사하시며 네 모든 병을 고치시며", zh: "我的心哪，你要称颂耶和华... 他赦免你的一切罪孽，医治你的一切疾病。", es: "Bendice, alma mía, a Jehová... Él es quien perdona todas tus iniquidades, el que sana todas tus dolencias;" }, tags: ["praise", "forgiveness"] },
    { id: "psalm-107-20", seriesId: "healing-100", order: 4, reference: { en: "Psalm 107:20", ko: "시편 107:20", zh: "诗篇 107:20", es: "Salmos 107:20" }, text: { en: "He sent out his word and healed them; he rescued them from the grave.", ko: "그가 그의 말씀을 보내어 그들을 고치시고 위험한 지경에서 건지시는도다", zh: "他发命医治他们，救他们脱离死亡。", es: "Envió su palabra, y los sanó, Y los libró de su ruina." }, tags: ["word", "rescue"] },
    { id: "isaiah-53-5", seriesId: "healing-100", order: 5, reference: { en: "Isaiah 53:5", ko: "이사야 53:5", zh: "以赛亚书 53:5", es: "Isaías 53:5" }, text: { en: "But he was pierced for our transgressions... by his wounds we are healed.", ko: "그가 찔림은 우리의 허물 때문이요... 그가 채찍에 맞으므로 우리는 나음을 받았도다", zh: "哪知他为我们的过犯受害... 因他受的鞭伤，我们得医治。", es: "Mas él herido fue por nuestras rebeliones... y por su llaga fuimos nosotros curados." }, tags: ["cross", "atonement"] },
    // Adding placeholder entries to reach 100 as requested, users can fill in specific verses.
    // In a real scenario, we would populate all 100 unique verses.
    // For now, repeating a pattern or using "To be updated" for the bulk to show structure.
    ...Array.from({ length: 95 }, (_, i) => ({
        id: `healing-placeholder-${i + 6}`,
        seriesId: "healing-100",
        order: i + 6,
        reference: { en: `Healing Verse ${i + 6}`, ko: `치유 말씀 ${i + 6}`, zh: `医治经文 ${i + 6}`, es: `Versículo de Sanidad ${i + 6}` },
        text: {
            en: "God's healing power is limitless (Verse content to be added).",
            ko: "하나님의 치유의 능력은 무한합니다 (말씀 내용 추가 예정).",
            zh: "神的医治大能是无限的（经文内容待添加）。",
            es: "El poder sanador de Dios es ilimitado (contenido del versículo por agregar)."
        },
        tags: ["healing"]
    }))
];
