import { proxyActivities } from '@temporalio/workflow';
import type { TranslationRequestCantonese } from '../types';
import type * as activities from '../../../sharable-activites/cantonese/activity';
import type { CangjieRequest, CangjieResponse } from '../../../sharable-activites/cantonese/types';
const { toCangjie, toJyupting } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

export async function translateCantonese(aRequest: TranslationRequestCantonese): Promise<string> {
  const cangjie:Array<CangjieResponse> = await toCangjie({text: aRequest.text, showChineseCode: true, showEnglishCode: true, useSucheng: true});
  const jyutping = await toJyupting(aRequest.text);
  return `cangjie: ${cangjie}\njyutping: ${jyutping}`;
}