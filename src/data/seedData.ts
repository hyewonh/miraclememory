import { Series, Verse } from "@/types";
import { ALL_VERSES } from "./verses";

export const INITIAL_SERIES: Series[] = [
    {
        id: "one-year-series",
        title: {
            en: "1-Year Scripture Series",
            ko: "1년 암송 시리즈",
            zh: "1年圣经背诵",
            es: "Memoria Bíblica de 1 Año"
        },
        description: {
            en: "A comprehensive journey through the entire Bible.",
            ko: "성경 전체를 아우르는 1년 간의 여정.",
            zh: "穿越整本圣经的全面旅程。",
            es: "Un viaje integral a través de toda la Biblia."
        },
        totalVerses: 365,
        coverImage: "/images/one-year.jpg"
    },
    {
        id: "gospel-3-months",
        title: {
            en: "3-Month Gospel Series",
            ko: "3개월 복음서 암송 시리즈",
            zh: "3个月福音书背诵",
            es: "Memoria del Evangelio de 3 Meses"
        },
        description: {
            en: "Walk with Jesus through the Gospels in 90 days.",
            ko: "90일 동안 복음서를 통해 예수님과 동행하세요.",
            zh: "90天通过福音书与耶稣同行。",
            es: "Camina con Jesús a través de los Evangelios en 90 días."
        },
        totalVerses: 90,
        coverImage: "/images/nature.jpg"
    },
    {
        id: "healing-100",
        title: {
            en: "Healing Verses 100",
            ko: "치유 성경암송 100구절 시리즈",
            zh: "医治经文100句",
            es: "Versículos de Sanidad 100"
        },
        description: {
            en: "God's promises for physical, emotional, and spiritual healing.",
            ko: "육신과 마음, 영혼의 치유를 위한 하나님의 약속.",
            zh: "上帝对身体、情感和灵性医治的应许。",
            es: "Promesas de Dios para la sanidad física, emocional y espiritual."
        },
        totalVerses: 100,
        coverImage: "/images/healing.jpg"
    },
    {
        id: "romans-30",
        title: {
            en: "Romans Core 30",
            ko: "로마서 핵심 30구절 암송시리즈",
            zh: "罗马书核心30句",
            es: "Romanos Núcleo 30"
        },
        description: {
            en: "Master the logic of salvation through 30 key verses from Romans.",
            ko: "구원의 논리를 로마서 30구절로 마스터하세요.",
            zh: "通过罗马书30句关键经文掌握救恩的逻辑。",
            es: "Domina la lógica de la salvación a través de 30 versículos clave de Romanos."
        },
        totalVerses: 30,
        coverImage: "/images/romans.jpg"
    },
    {
        id: "prayer-series",
        title: {
            en: "Prayer Bible Verses",
            ko: "기도 성경암송 시리즈",
            zh: "祷告经文系列",
            es: "Versículos Bíblicos de Oración"
        },
        description: {
            en: "Deepen your prayer life with the Word.",
            ko: "말씀으로 당신의 기도 생활을 깊게 하세요.",
            zh: "用神的话语加深你的祷告生活。",
            es: "Profundiza tu vida de oración con la Palabra."
        },
        totalVerses: 30,
        coverImage: "/images/prayer.jpg"
    },
    {
        id: "faith-30",
        title: {
            en: "Faith Verses 30",
            ko: "믿음의 말씀 30구절 시리즈",
            zh: "信心经文30句",
            es: "Versículos de Fe 30"
        },
        description: {
            en: "Strengthen your faith with these powerful verses.",
            ko: "강력한 말씀으로 믿음을 굳건히 하세요.",
            zh: "用这些有力的经文坚固你的信心。",
            es: "Fortalece tu fe con estos poderosos versículos."
        },
        totalVerses: 30,
        coverImage: "/images/faith.jpg"
    },
    {
        id: "holyspirit-30",
        title: {
            en: "Holy Spirit Verses 30",
            ko: "성령 말씀암송 30구절 시리즈",
            zh: "圣灵经文30句",
            es: "Versículos del Espíritu Santo 30"
        },
        description: {
            en: "Walk in step with the Holy Spirit.",
            ko: "성령님과 동행하는 삶을 위한 말씀.",
            zh: "与圣灵同行。",
            es: "Camina en sintonía con el Espíritu Santo."
        },
        totalVerses: 30,
        coverImage: "/images/fire.jpg"
    },
    {
        id: "selfesteem-30",
        title: {
            en: "Self-Esteem Verses 30",
            ko: "자존감회복 30구절 시리즈",
            zh: "自尊经文30句",
            es: "Versículos de Autoestima 30"
        },
        description: {
            en: "Find your true identity and worth in Christ.",
            ko: "그리스도 안에서 참된 정체성과 가치를 찾으세요.",
            zh: "在基督里找到你真实的身份和价值。",
            es: "Encuentra tu verdadera identidad y valor en Cristo."
        },
        totalVerses: 30,
        coverImage: "/images/identity.jpg"
    },
    {
        id: "acts-30",
        title: {
            en: "Acts Core 30",
            ko: "사도행전 핵심 30구절",
            zh: "使徒行传核心30句",
            es: "Hechos Núcleo 30"
        },
        description: {
            en: "The birth of the church and the spread of the Gospel.",
            ko: "교회의 탄생과 복음의 확산.",
            zh: "教会的诞生和福音的传播。",
            es: "El nacimiento de la iglesia y la expansión del Evangelio."
        },
        totalVerses: 30,
        coverImage: "/images/acts.jpg"
    },
    {
        id: "corinthians-30",
        title: {
            en: "Corinthians Core 30",
            ko: "고린도서 핵심 30구절",
            zh: "哥林多书核心30句",
            es: "Corintios Núcleo 30"
        },
        description: {
            en: "Wisdom for church life and spiritual gifts.",
            ko: "교회 생활과 영적 은사를 위한 지혜.",
            zh: "教会生活和属灵恩赐的智慧。",
            es: "Sabiduría para la vida de la iglesia y los dones espirituales."
        },
        totalVerses: 30,
        coverImage: "/images/corinthians.jpg"
    },
    {
        id: "galatians-30",
        title: {
            en: "Galatians Core 30",
            ko: "갈라디아서 핵심 30구절",
            zh: "加拉太书核心30句",
            es: "Gálatas Núcleo 30"
        },
        description: {
            en: "Freedom in Christ and the fruit of the Spirit.",
            ko: "그리스도 안에서의 자유와 성령의 열매.",
            zh: "在基督里的自由和圣灵的果子。",
            es: "Libertad en Cristo y el fruto del Espíritu."
        },
        totalVerses: 30,
        coverImage: "/images/galatians.jpg"
    },
    {
        id: "ephesians-30",
        title: {
            en: "Ephesians Core 30",
            ko: "에베소서 핵심 30구절",
            zh: "以弗所书核心30句",
            es: "Efesios Núcleo 30"
        },
        description: {
            en: "The church as the body of Christ and spiritual armor.",
            ko: "그리스도의 몸 된 교회와 영적 갑옷.",
            zh: "教会作为基督的身体和属灵军装。",
            es: "La iglesia como cuerpo de Cristo y armadura espiritual."
        },
        totalVerses: 30,
        coverImage: "/images/ephesians_armor.jpg"
    },
    {
        id: "philippians-30",
        title: {
            en: "Philippians Core 30",
            ko: "빌립보서 핵심 30구절",
            zh: "腓立比书核心30句",
            es: "Filipenses Núcleo 30"
        },
        description: {
            en: "Joy in suffering and the mind of Christ.",
            ko: "고난 중의 기쁨과 그리스도의 마음.",
            zh: "患难中的喜乐和基督的心。",
            es: "Gozo en el sufrimiento y la mente de Cristo."
        },
        totalVerses: 30,
        coverImage: "/images/philippians_joy.jpg"
    },
    {
        id: "colossians-30",
        title: {
            en: "Colossians Core 30",
            ko: "골로새서 핵심 30구절",
            zh: "歌罗西书核心30句",
            es: "Colosenses Núcleo 30"
        },
        description: {
            en: "The supremacy and sufficiency of Christ.",
            ko: "그리스도의 탁월하심과 충분하심.",
            zh: "基督的至高无上和充足。",
            es: "La supremacía y suficiencia de Cristo."
        },
        totalVerses: 30,
        coverImage: "/images/colossians.jpg"
    },
    {
        id: "pastoral-30",
        title: {
            en: "Pastoral Epistles Core 30",
            ko: "목회서신 핵심 30구절",
            zh: "教牧书信核心30句",
            es: "Epístolas Pastorales Núcleo 30"
        },
        description: {
            en: "Leadership, godliness, and sound doctrine.",
            ko: "리더십, 경건, 그리고 건전한 교리.",
            zh: "领导力、敬虔和纯正的教义。",
            es: "Liderazgo, piedad y sana doctrina."
        },
        totalVerses: 30,
        coverImage: "/images/pastoral.jpg"
    },
    {
        id: "hebrews-30",
        title: {
            en: "Hebrews Core 30",
            ko: "히브리서 핵심 30구절",
            zh: "希伯来书核心30句",
            es: "Hebreos Núcleo 30"
        },
        description: {
            en: "Jesus is greater than all.",
            ko: "모든 것보다 뛰어나신 예수님.",
            zh: "耶稣超越一切。",
            es: "Jesús es mayor que todo."
        },
        totalVerses: 30,
        coverImage: "/images/hebrews.jpg"
    },
    {
        id: "peter-30",
        title: {
            en: "Peter Core 30",
            ko: "베드로서 핵심 30구절",
            zh: "彼得书信核心30句",
            es: "Pedro Núcleo 30"
        },
        description: {
            en: "Hope in suffering and holy living.",
            ko: "고난 중의 소망과 거룩한 삶.",
            zh: "苦难中的盼望和圣洁的生活。",
            es: "Esperanza en el sufrimiento y vida santa."
        },
        totalVerses: 30,
        coverImage: "/images/peter.jpg"
    },
    {
        id: "james-30",
        title: {
            en: "James Core 30",
            ko: "야고보서 핵심 30구절",
            zh: "雅各书核心30句",
            es: "Santiago Núcleo 30"
        },
        description: {
            en: "Faith without works is dead.",
            ko: "행함이 없는 믿음은 죽은 것이라.",
            zh: "没有行为的信心是死的。",
            es: "La fe sin obras está muerta."
        },
        totalVerses: 30,
        coverImage: "/images/james.jpg"
    },
    {
        id: "john-epistles-30",
        title: {
            en: "John Epistles Core 30",
            ko: "요한1,2,3서 핵심 30구절",
            zh: "约翰书信核心30句",
            es: "Epístolas de Juan Núcleo 30"
        },
        description: {
            en: "God is love and light.",
            ko: "하나님은 사랑이시라.",
            zh: "神就是爱和光。",
            es: "Dios es amor y luz."
        },
        totalVerses: 30,
        coverImage: "/images/john_epistles.jpg"
    },
    {
        id: "revelation-30",
        title: {
            en: "Revelation Core 30",
            ko: "요한계시록 핵심 30구절",
            zh: "启示录核心30句",
            es: "Apocalipsis Núcleo 30"
        },
        description: {
            en: "The victory of the Lamb and the new creation.",
            ko: "어린 양의 승리와 새 창조.",
            zh: "羔羊的得胜和新创造。",
            es: "La victoria del Cordero y la nueva creación."
        },
        totalVerses: 30,
        coverImage: "/images/revelation.jpg"
    }
];

export const VERSES: Verse[] = ALL_VERSES;
