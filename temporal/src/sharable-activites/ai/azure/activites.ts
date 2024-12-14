import { AzureClient } from "./client";

export function createAzureActivites(anAzureClient: AzureClient) {
  return {
    getLanguages: anAzureClient.getLanguages.bind(anAzureClient),
    translate: anAzureClient.translate.bind(anAzureClient),
    transliterate: anAzureClient.transliterate.bind(anAzureClient),
    breaksentence: anAzureClient.breaksentence.bind(anAzureClient),
    dictionaryLookup: anAzureClient.dictionaryLookup.bind(anAzureClient),
    dictionaryExamples: anAzureClient.dictionaryExamples.bind(anAzureClient)
  }
}