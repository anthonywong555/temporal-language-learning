export interface TranslationRequest {
  query: string;
  workflowId: string;
  interval?: any;
}

export interface TranslationResponse {
  status: string;
  results: TranslationServiceResponse[];
}

export interface TranslationHistory {
  request: TranslationRequest;
  response: TranslationResponse;
  isSave?: boolean;
}

export interface TranslationServiceResponse {
  service: string; // name of the service that used to translate
  model?: string; // name of the ai model you used.
  englishText: string;
  possibleTranslations: ChineseCharacter[];
  errorMessage?: string;
}

export interface ChineseCharacter {
  cangjieEnglishCodes: any;
  chineseText: any;
  jyutping: any;
  cangjieChineseCodes: any;
  chineseCharacter: string; // 我
  jyupting: string | null; // ngo5
  cangjie: {
      chineseCode: string | undefined; // 竹手戈
      englishCode: string | undefined; // HQI
  }
}
