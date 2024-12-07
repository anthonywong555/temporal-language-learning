import radicals from '../../../../data/radicals.json';
import cangjie from '../../../../data/cangjie.json';
import { CangjieRequest, CangjieResponse } from "./types";

export async function isChinese(text: string) {
  return {
      isChinese: /[\u4E00-\u9FFF]/.test(text),
      code: text.charCodeAt(0).toString(16).toLowerCase()
  }
}

async function removeEnglishText(text = '') {
  return text.replace(/(\w|"|').+/, '');
}

export async function toJyupting(chineseText: string): Promise<[string, string | null][]> {
  const ToJyutping = import('to-jyutping');
  return (await ToJyutping).getJyutpingList(chineseText);
}

/**
 * Kudo to @kennethkn!
 * Direct copy of his code: https://github.com/kennethkn/cangjie-sucheng-lookup/blob/master/src/App.tsx 
 * @param aRequest 
 * @returns 
 */
export async function toCangjie(aRequest: CangjieRequest): Promise<Array<CangjieResponse>> {
  const {showChineseCode = true, showEnglishCode = true, useSucheng = false} = aRequest;
  let {text} = aRequest;
  
  text = await removeEnglishText(text);
  
  const radicalsMapRef = new Map<string, string>();
  const cangjieMapRef = new Map<string, string>();

  for(const [key, value] of Object.entries(radicals)) {
    radicalsMapRef.set(key, value);
  }

  for(const [key, value] of Object.entries(cangjie)) {
    cangjieMapRef.set(key, value);
  }

  const results:Array<CangjieResponse> = [];
  if(await isChinese(text)) {
    const characters = text.split('');

    characters.forEach(c => {
      let cj = '';
      try {
        cj =
        cangjieMapRef.get(c.charCodeAt(0).toString(16).toUpperCase()) ?? '';
        if (useSucheng && cj.length > 1) cj = cj.charAt(0) + cj.slice(-1)
      } catch {
        // do nothing because it just means the char has no cangjie/sucheng code
      } finally {
        if(cj) {
          results.push({
            chineseCharacter: c,
            ...(showChineseCode || showEnglishCode ? {
              chineseCangjie: {
                  ...(showEnglishCode && {englishCode: cj}),
                  ...(showChineseCode && {chineseCode: cj
                  .split('')
                  .map(ch => radicalsMapRef.get(ch.toLowerCase()))
                  .join('')})
            }}: {})
          })
        }
      }
    });

    console.log(results);
    return results;
  } else {
    return [];
  }
}