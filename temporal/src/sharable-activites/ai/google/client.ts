import { Translate, TranslateConfig, TranslateRequest } from "@google-cloud/translate/build/src/v2";

export class GoogleClient {
  client;

  constructor(options?: TranslateConfig) {
    this.client = new Translate(options);
  }

  async listLanguages(target?: string) {
    return this.client.getLanguages(target);
  }

  async translateText(input: string, options: TranslateRequest) {
    return await this.client.translate(input, options);
  }

  async detectLanguage(input: string) {
    return await this.client.detect(input);
  }
}