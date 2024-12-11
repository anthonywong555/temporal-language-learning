import { AnkiClient } from './client';

export function createAnkiActivites(anAnkiClient: AnkiClient) {
  return {
    getDecks: anAnkiClient.getDecks.bind(anAnkiClient),
    getDeckNames: anAnkiClient.getDeckNames.bind(anAnkiClient)
  }
}