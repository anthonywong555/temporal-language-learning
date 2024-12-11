export interface LearningSessionRequest {
  deckName: string
}

export interface AddWordRequest {
  chineseText: string,
  englishText: string,
  jyutping: string,
  cangjie: string,
}