import type { CangjieResponse } from "../../../sharable-activites/cantonese/types";

export interface TranslationCantoneseRequest {
    text: string;
}

export interface TranslationCantoneseResponse {
    chineseText: string;
    englishText: string;
    jyutping: [string, string | null][];
    cangjie: Array<CangjieResponse>;
}