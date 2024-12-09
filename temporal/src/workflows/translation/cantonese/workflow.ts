import { proxyActivities, proxyLocalActivities, startChild } from '@temporalio/workflow';
import type { TranslationCantoneseRequest, TranslationCantoneseResponse, TranslationServiceResponse, ChineseCharacter } from './types';
import type * as activities from '../../../sharable-activites/cantonese/activity';
import { createAnthropicActivites } from '../../../sharable-activites/ai/anthropic/activites';
import { createOpenAIActivites } from '../../../sharable-activites/ai/openai/activites';
import type Anthropic from '@anthropic-ai/sdk';

const { toCangjie, toJyupting, isChinese } = proxyLocalActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { anthropicCreateMessage } = proxyActivities<ReturnType<typeof createAnthropicActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
})

const { openAICreateMessage } = proxyActivities<ReturnType<typeof createOpenAIActivites>>({
  scheduleToCloseTimeout: '3 minute',
  retry: {
    maximumAttempts: 3
  }
});

export async function translateCantonese(aRequest: TranslationCantoneseRequest): Promise<Array<TranslationCantoneseResponse>> {
  let chineseTexts = [];
  
  if(await isChinese(aRequest.text)) {
    // Simply just just jyupting and cangjie
    chineseTexts.push(aRequest.text);
  } else {
    await startChild(anthropicTranslateCantonese, {
      args: [aRequest.text],
      parentClosePolicy: 'ABANDON'
    });

    await startChild(openAITranslateCantonese, {
      args: [aRequest.text],
      parentClosePolicy: 'ABANDON'
    });
  }

  return [];
}

export async function openAITranslateCantonese(text: string): Promise<TranslationServiceResponse> {
  // Look for possible translation
  const openAIResponse = await openAICreateMessage({
    messages: [{ role: 'user', content: `Get the possible translation of '${text}' in Cantonese i.e Traditional Chinese. Please only return back an array of strings.` }],
    model: 'gpt-4o',
  });

  let openAIResults:Array<string> = [];

  if(openAIResponse.choices[0].message.content) {
    openAIResults = JSON.parse(openAIResponse.choices[0].message.content);
  }

  const possibleTranslations:any[] = [];

  for(const aWord of openAIResults) {
    const chineseCharacters:Array<string> = aWord.split('');
    //["現", "在"]

    const aWordResponse = [];

    for(const aChineseCharacter of chineseCharacters) {
      const {cangjie, jyutping} = await getCangjieAndJyupting(aChineseCharacter);
      const theActualJyutping = jyutping[0];
      aWordResponse.push({
        chineseText: aChineseCharacter,
        jyutping: theActualJyutping[1],
        cangjie: {
          chineseCode: cangjie[0].chineseCangjie?.chineseCode,
          englishCode: cangjie[0].chineseCangjie?.englishCode
        }
      });
    }

    possibleTranslations.push(aWordResponse);
  }

  return {
    service: 'openAI',
    englishText: text,
    possibleTranslations: possibleTranslations
  };
}

export async function anthropicTranslateCantonese(text: string): Promise<TranslationServiceResponse> {
  const anthropicResponse = await anthropicCreateMessage({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Get the possible translation of '${text}' in Cantonese i.e Traditional Chinese. Please only return back an array of strings.` }],
  });

  const anthropicResults:Array<string> = JSON.parse((anthropicResponse.content[0] as Anthropic.TextBlock).text);
  //"[\"現在\", \"而家\", \"依家\", \"宜家\"]"

  const possibleTranslations:any[] = [];

  for(const aWord of anthropicResults) {
    const chineseCharacters:Array<string> = aWord.split('');
    //["現", "在"]

    const aWordResponse = [];

    for(const aChineseCharacter of chineseCharacters) {
      const {cangjie, jyutping} = await getCangjieAndJyupting(aChineseCharacter);
      const theActualJyutping = jyutping[0];
      aWordResponse.push({
        chineseText: aChineseCharacter,
        jyutping: theActualJyutping[1],
        cangjie: {
          chineseCode: cangjie[0].chineseCangjie?.chineseCode,
          englishCode: cangjie[0].chineseCangjie?.englishCode
        }
      });
    }

    possibleTranslations.push(aWordResponse);
  }

  return {
    service: 'claude',
    englishText: text,
    possibleTranslations
  };
}

async function getCangjieAndJyupting(chineseText: string) {
  const cangjie = await toCangjie({text: chineseText, showChineseCode: true, showEnglishCode: true, useSucheng: false});
  const jyutping = await toJyupting(chineseText);
  return {
    cangjie,
    jyutping
  };
}