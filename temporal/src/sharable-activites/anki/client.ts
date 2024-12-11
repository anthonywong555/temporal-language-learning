export class AnkiClient {
  client: any;

  constructor(options?: any) {
    (async () => {
      const { YankiConnect } = await import('yanki-connect'); // Dynamically import the ESM module
      this.client = new YankiConnect(options);
    })();
  }

  async getDecks(params: Record<"cards", number[]>) {
    return await this.client.deck.getDecks(params);
  }

  async getDeckNames() {
    return await this.client.deck.deckNames();
  }
}