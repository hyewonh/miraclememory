
import { Verse } from "@/types";

export const GOSPEL_VERSES: Verse[] = [
    { id: "john-1-1", seriesId: "gospel-3-months", order: 1, reference: { en: "John 1:1", ko: "요한복음 1:1", zh: "约翰福音 1:1", es: "Juan 1:1" }, text: { en: "In the beginning was the Word, and the Word was with God, and the Word was God.", ko: "태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라", zh: "起初道，道与神同在，道就是神。", es: "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios." }, tags: ["word", "god"] },
    { id: "john-1-14", seriesId: "gospel-3-months", order: 2, reference: { en: "John 1:14", ko: "요한복음 1:14", zh: "约翰福音 1:14", es: "Juan 1:14" }, text: { en: "The Word became flesh and made his dwelling among us...", ko: "말씀이 육신이 되어 우리 가운데 거하시매...", zh: "道成了肉身，住在我们中间...", es: "Y aquel Verbo fue hecho carne, y habitó entre nosotros..." }, tags: ["incarnation"] },
    { id: "john-3-16", seriesId: "gospel-3-months", order: 3, reference: { en: "John 3:16", ko: "요한복음 3:16", zh: "约翰福音 3:16", es: "Juan 3:16" }, text: { en: "For God so loved the world...", ko: "하나님이 세상을 이처럼 사랑하사...", zh: "神爱世人...", es: "Porque de tal manera amó Dios al mundo..." }, tags: ["love", "gospel"] },
    { id: "mark-1-15", seriesId: "gospel-3-months", order: 4, reference: { en: "Mark 1:15", ko: "마가복음 1:15", zh: "马可福音 1:15", es: "Marcos 1:15" }, text: { en: "“The time has come,” he said. “The kingdom of God has come near. Repent and believe the good news!”", ko: "이르시되 때가 찼고 하나님의 나라가 가까이 왔으니 회개하고 복음을 믿으라 하시더라", zh: "说：“日期满了，神的国近了。你们当悔改，信福音！”", es: "Diciendo: El tiempo se ha cumplido, y el reino de Dios se ha acercado; arrepentíos, y creed en el evangelio." }, tags: ["repentance", "kingdom"] },
    // Fill remaining with placeholders for now
    ...Array.from({ length: 86 }, (_, i) => ({
        id: `gospel-placeholder-${i + 5}`,
        seriesId: "gospel-3-months",
        order: i + 5,
        reference: { en: `Gospel Day ${i + 5}`, ko: `복음 말씀 ${i + 5}일차`, zh: `福音第 ${i + 5} 天`, es: `Evangelio Día ${i + 5}` },
        text: {
            en: "Walking with Jesus through the Gospels (Verse to be added).",
            ko: "복음서를 통해 예수님과 동행하기 (말씀 추가 예정).",
            zh: "通过福音书与耶稣同行（经文待添加）。",
            es: "Caminando con Jesús a través de los Evangelios (Versículo por agregar)."
        },
        tags: ["gospel"]
    }))
];
