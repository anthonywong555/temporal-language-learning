import TextTranslationClient from "@azure-rest/ai-translation-text";
import type { Translate, TranslatorCredential, InputTextItem, TranslateParameters, Translate200Response, TranslateDefaultResponse, TransliterateParameters, TransliterateDefaultResponse, Transliterate200Response, FindSentenceBoundariesParameters, GetSupportedLanguagesParameters, LookupDictionaryEntriesParameters }  from "@azure-rest/ai-translation-text";


export class AzureClient {
  client;

  constructor(translateCedential: TranslatorCredential, endpoint: string) {
    this.client = TextTranslationClient(endpoint, translateCedential);
  }

  async getLanguages(options?: GetSupportedLanguagesParameters) {
    return await this.client.path('/languages').get(options);
  }

  async translate(options: TranslateParameters) {
    return await this.client.path('/translate').post(options);
  }

  async transliterate(options: TransliterateParameters) {
    return await this.client.path('/transliterate').post(options);
  }

  async breaksentence(options: FindSentenceBoundariesParameters) {
    return await this.client.path('/breaksentence').post(options);
  }

  async dictionaryLookup(options: LookupDictionaryEntriesParameters) {
    return await this.client.path('/dictionary/lookup').post(options);
  }

  async dictionaryExamples(options: LookupDictionaryEntriesParameters) {
    return await this.client.path('/dictionary/lookup').post(options);
  }
}