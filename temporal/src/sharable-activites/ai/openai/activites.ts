import { OpenAIClient } from "./client";

export function createOpenAIActivites(anOpenAIClient: OpenAIClient) {
  return {
    createMessage: anOpenAIClient.createMessage.bind(anOpenAIClient)
  }
}