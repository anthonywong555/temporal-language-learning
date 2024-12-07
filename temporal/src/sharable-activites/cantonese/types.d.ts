export interface CangjieRequest {
  text: string,
  showChineseCode?: boolean;
  showEnglishCode?: boolean;
  useSucheng?: boolean;
}

export interface CangjieResponse {
  chineseCharacter: string,
  chineseCangjie?: {
    englishCode?: string,
    chineseCode?: string,
  }
}