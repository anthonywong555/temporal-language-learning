import { proxyActivities, proxyLocalActivities } from '@temporalio/workflow';
import type { TranslationRequestCantonese } from '../types';
import type * as activities from '../../../sharable-activites/cantonese/activity';
import type { CangjieResponse } from '../../../sharable-activites/cantonese/types';
import { createAnthropicActivites } from '../../../sharable-activites/ai/anthropic/activites';

const { toCangjie, toJyupting } = proxyLocalActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { createMessage } = proxyActivities<ReturnType<typeof createAnthropicActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
})

export async function translateCantonese(aRequest: TranslationRequestCantonese): Promise<string> {
  const cangjie:Array<CangjieResponse> = await toCangjie({text: aRequest.text, showChineseCode: true, showEnglishCode: true, useSucheng: true});
  const jyutping = await toJyupting(aRequest.text);

  const test = 'later';
  const anthropicResponse = await createMessage({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {"role": "user", "content": `Get the possible translation of '${test}' in Cantonese. Please only return back an array of strings.`}
    ]
  });
  return `cangjie: ${cangjie}\njyutping: ${jyutping}`;
}