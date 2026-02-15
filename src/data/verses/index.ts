
import { Verse } from "@/types";
import { ROMANS_VERSES } from "./romans";
import { HEALING_VERSES } from "./healing";
import { GOSPEL_VERSES } from "./gospel";
import { ONE_YEAR_VERSES } from "./oneYear";

export const ALL_VERSES: Verse[] = [
    ...ROMANS_VERSES,
    ...HEALING_VERSES,
    ...GOSPEL_VERSES,
    ...ONE_YEAR_VERSES
];
