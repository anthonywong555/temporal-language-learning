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

export interface TranslationServiceResponse {
    service: string; // name of the service that used to translate
    model?: string; // name of the ai model you used.
    englishText: string;
    possibleTranslations: ChineseCharacter[];
    errorMessage?: string;
}

export interface ChineseCharacter {
    chineseCharacter: string; // 我
    jyupting: string | null; // ngo5
    cangjie: {
        chineseCode: string | undefined; // 竹手戈
        englishCode: string | undefined; // HQI
    }
}

// Define the structure of a resolved or rejected result
export interface PromiseResult {
    status: 'resolved' | 'rejected';
    value?: TranslationServiceResponse; // For resolved promises
    error?: string; // For rejected promises
    index: number;  // The index of the promise in the original array
};  