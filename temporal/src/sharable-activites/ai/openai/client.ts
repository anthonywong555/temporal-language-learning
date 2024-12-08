import OpenAI from 'openai';
import type { RequestOptions } from 'openai/core.mjs';

export class OpenAIClient {
  client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey
    });
  }

  async createMessage(body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, options?: RequestOptions):Promise<OpenAI.Chat.Completions.ChatCompletion> {
    return await this.client.chat.completions.create(body, options);
  }
}