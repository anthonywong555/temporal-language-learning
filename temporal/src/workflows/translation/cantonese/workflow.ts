import { proxyActivities, proxyLocalActivities } from '@temporalio/workflow';
import type { TranslationCantoneseRequest, TranslationCantoneseResponse } from './types';
import type * as activities from '../../../sharable-activites/cantonese/activity';
import type { CangjieResponse } from '../../../sharable-activites/cantonese/types';
import { createAnthropicActivites } from '../../../sharable-activites/ai/anthropic/activites';
import { createOpenAIActivites } from '../../../sharable-activites/ai/openai/activites';

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
    await anthropicCreateMessage({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Get the possible translation of '${aRequest.text}' in Cantonese i.e Traditional Chinese. Please only return back an array of strings.` }],
    });

    // Look for possible translation
    const openAIResponse = await openAICreateMessage({
      messages: [{ role: 'user', content: `Get the possible translation of '${aRequest.text}' in Cantonese i.e Traditional Chinese. Please only return back an array of strings.` }],
      model: 'gpt-4o',
    });

    if(openAIResponse.choices[0].message.content) {
      chineseTexts = JSON.parse(openAIResponse.choices[0].message.content);
    }
  }

  const results = await Promise.all(chineseTexts.map(async (aWord: string) => {
    const cangjie = await toCangjie({text: aWord, showChineseCode: true, showEnglishCode: true, useSucheng: false});
    const jyutping = await toJyupting(aWord);
    return {
      chineseText: aWord,
      jyutping,
      cangjie
    }
  }));

  return results;
}