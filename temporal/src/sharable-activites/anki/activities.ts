import { AnkiClient } from './client';

export function createAnkiActivites(anAnkiClient: AnkiClient) {
  return {
    getDecks: anAnkiClient.getDecks.bind(anAnkiClient),
    getDeckNames: anAnkiClient.getDeckNames.bind(anAnkiClient),
    getModelNamesAndIds: anAnkiClient.getModelNamesAndIds.bind(anAnkiClient),
    createDeck: anAnkiClient.createDeck.bind(anAnkiClient),
    addNote: anAnkiClient.addNote.bind(anAnkiClient),
    addNotes: anAnkiClient.addNotes.bind(anAnkiClient),
  }
}