import { GoogleClient } from "./client";

export function createGoogleActivites(anGoogleClient: GoogleClient) {
  return {
    listLanguages: anGoogleClient.listLanguages.bind(anGoogleClient),
    translateText: anGoogleClient.translateText.bind(anGoogleClient),
    detectLanguage: anGoogleClient.detectLanguage.bind(anGoogleClient)
  }
}