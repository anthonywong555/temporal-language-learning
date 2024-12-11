import type { Note, NoteWithCreationOptions } from './types';

export class AnkiClient {
  client: any;

  constructor(options?: any) {
    (async () => {
      const { YankiConnect } = await import('yanki-connect'); // Dynamically import the ESM module
      this.client = new YankiConnect(options);
    })();
  }

  async getDecks(params: Record<"cards", number[]>):Promise<Record<string, number[]>> {
    return await this.client.deck.getDecks(params);
  }

  async getDeckNames():Promise<string[]> {
    return await this.client.deck.deckNames();
  }

  async createDeck(params: {
    deck: string;
  }): Promise<Record<string, number>> {
    return await this.client.deck.createDeck(params)
  }

  async addNote(params: {
    note: NoteWithCreationOptions;
  }): Promise<number | null> {
    return await this.client.note.addNote(params);
  }

  async addNotes(params: {
    notes: NoteWithCreationOptions[];
  }) : Promise<(string | null)[]> {
    return await this.client.note.addNotes(params);
  }

  async getModelNamesAndIds():Promise<Record<string, number>> {
    return await this.client.model.modelNamesAndIds();
  }
}