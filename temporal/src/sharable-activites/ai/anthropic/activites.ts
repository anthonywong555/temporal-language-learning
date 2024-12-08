import { AnthropicClient } from "./client";

export function createAnthropicActivites(anAnthropicClient: AnthropicClient) {
  return {
    createMessage: anAnthropicClient.createMessage.bind(anAnthropicClient)
  }
}