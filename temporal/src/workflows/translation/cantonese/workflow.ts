import { defineQuery, proxyActivities, proxyLocalActivities, setHandler, startChild, workflowInfo } from '@temporalio/workflow';
import type { PromiseResult, TranslationCantoneseRequest, TranslationServiceResponse } from './types';
import type * as activities from '../../../sharable-activites/cantonese/activity';
import { createAnthropicActivites } from '../../../sharable-activites/ai/anthropic/activites';
import { createOpenAIActivites } from '../../../sharable-activites/ai/openai/activities';
import { createGoogleActivites } from '../../../sharable-activites/ai/google/activites';
import { createAzureActivites } from '../../../sharable-activites/ai/azure/activites';
import type {TranslatedTextItemOutput} from '@azure-rest/ai-translation-text'
import * as toolActivites from '../../../sharable-activites/tools/activity';
import type Anthropic from '@anthropic-ai/sdk';

const { toCangjie, toJyupting, isChinese } = proxyActivities<typeof activities>({
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

const { detectLanguage, translateText } = proxyActivities<ReturnType<typeof createGoogleActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { translate } = proxyActivities<ReturnType<typeof createAzureActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
})

const { randomDelay } = proxyActivities<typeof toolActivites>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

export const getTranslations = defineQuery<Array<TranslationServiceResponse>, []>('getTranslations');

export async function translateCantonese(aRequest: TranslationCantoneseRequest): Promise<Array<TranslationServiceResponse>> {
  let results:Array<TranslationServiceResponse> = [];
  
  await detectLanguage(aRequest.text);

  setHandler(getTranslations, () => {
    return results;
  });

  if(await isChinese(aRequest.text)) {
    // Simply just just jyupting and cangjie
    const chineseCharacters = aRequest.text.split('');
    const formattedChineseCharacters = [];

    for(const aChineseCharacter of chineseCharacters) {
      const {cangjie, jyutping} = await getCangjieAndJyupting(aChineseCharacter);
      const theActualJyutping = jyutping[0];
      formattedChineseCharacters.push({
        chineseText: aChineseCharacter,
        jyutping: theActualJyutping[1],
        cangjie: {
          chineseCode: cangjie[0].chineseCangjie?.chineseCode,
          englishCode: cangjie[0].chineseCangjie?.englishCode
        }
      });
    }

  } else {
    const anthropicChildWorkflowHandle = await startChild(AnthropicAIGetPossibleTranslationCantonese, {
      args: [aRequest.text],
      workflowId: `anthropic-${workflowInfo().workflowId}`,
    });

    const openAIChildWorkflowHandle = await startChild(OpenAIGetPossibleTranslationCantonese, {
      args: [aRequest.text],
      workflowId: `openai-${workflowInfo().workflowId}`
    });

    const azureChildWorkflowHandle = await startChild(azureTranslate, {
      args: [aRequest.text],
      workflowId: `azure-${workflowInfo().workflowId}`,
      parentClosePolicy: 'ABANDON'
    })

    const googleChildWorkflowHandle = await startChild(googleTranslate, {
      args: [aRequest.text],
      workflowId: `google-${workflowInfo().workflowId}`,
      parentClosePolicy: 'ABANDON'
    })

    const runningTranslationServices = [anthropicChildWorkflowHandle.result(), openAIChildWorkflowHandle.result(), azureChildWorkflowHandle.result(), googleChildWorkflowHandle.result()];

    // Code Gen by ChatGPT-4o
    while(runningTranslationServices.length > 0) {
      const racePromises = runningTranslationServices.map((promise, index) =>
        promise
          .then((value) => ({ status: 'resolved', value, index } as PromiseResult))
          .catch((error) => ({ status: 'rejected', error, index } as PromiseResult))
      );

      const resolveChildWorkflow = await Promise.race(racePromises);

      if(resolveChildWorkflow.status === 'resolved' && resolveChildWorkflow.value) {
        results.push(resolveChildWorkflow.value);
      }

      // results.push(resolveChildWorkflow.value);
      runningTranslationServices.splice(resolveChildWorkflow.index, 1);

      // Log the result
      if (resolveChildWorkflow.status === 'resolved') {
        console.log(`Promise resolved: ${resolveChildWorkflow.value}`);
      } else {
        console.log(`Promise rejected: ${resolveChildWorkflow.error}`);
      }
    }
  }

  return results;
}

export async function googleTranslate(text: string) {
  const service = 'Google';
  const possibleTranslations:any[] = [];

  const googleResponse = await translateText(text, {
    from: 'en',
    to: 'yue',
    format: 'text'
  });

  const chineseCharacters:Array<string> = googleResponse[0].split('');
  //["現", "在"]

  const aWordResponse = [];

  for(const aChineseCharacter of chineseCharacters) {
    if(await isChinese(aChineseCharacter)) {
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
  }

  possibleTranslations.push(aWordResponse);

  return {
    service,
    englishText: text,
    possibleTranslations
  };
}

export async function azureTranslate(text: string) {
  const service = 'Azure';
  const possibleTranslations:any[] = [];

  const azureResponse = await translate({
    body: [{
      text
    }],
    queryParameters: {
      from: 'en',
      to: 'yue'
    }
  });

  const test = azureResponse.body;
  if((test as TranslatedTextItemOutput[]).length > 0) {
    const test1 = (test as TranslatedTextItemOutput[]);
    const azureResults = test1[0].translations;

    for(const aWord of azureResults) {
      const chineseCharacters:Array<string> = aWord.text.split('');
      //["現", "在"]
  
      const aWordResponse = [];
  
      for(const aChineseCharacter of chineseCharacters) {
        if(await isChinese(aChineseCharacter)) {
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
      }
  
      possibleTranslations.push(aWordResponse);
    }
  }

  return {
    service,
    englishText: text,
    possibleTranslations
  };
}

export async function OpenAIGetPossibleTranslationCantonese(text: string): Promise<TranslationServiceResponse> {
  const service = 'OpenAI';
  const model = 'gpt-4o';
  const possibleTranslations:any[] = [];

  // Look for possible translation
  const openAIResponse = await openAICreateMessage({
    messages: [{ role: 'user', content: `Get the possible translation of '${text}' in Cantonese i.e Traditional Chinese. Please only return back an array of strings.` }],
    model,
  });

  let openAIResults:Array<string> = [];

  if(openAIResponse.choices[0].message.content) {
    openAIResults = JSON.parse(openAIResponse.choices[0].message.content);
  }

  for(const aWord of openAIResults) {
    const chineseCharacters:Array<string> = aWord.split('');
    //["現", "在"]

    const aWordResponse = [];

    for(const aChineseCharacter of chineseCharacters) {
      if(await isChinese(aChineseCharacter)) {
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
    }

    possibleTranslations.push(aWordResponse);
  }

  return {
    service,
    model,
    englishText: text,
    possibleTranslations: possibleTranslations
  };
}

export async function AnthropicAIGetPossibleTranslationCantonese(text: string): Promise<TranslationServiceResponse> {
  const service = 'Anthropic';
  const model = 'claude-3-5-sonnet-20241022';
  const possibleTranslations:any[] = [];

  const anthropicResponse = await anthropicCreateMessage({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: `Get the possible translation of '${text}' in Cantonese i.e Traditional Chinese. Please only return back an array of strings.` }],
  });

  const anthropicResults:Array<string> = JSON.parse((anthropicResponse.content[0] as Anthropic.TextBlock).text);
  //"[\"現在\", \"而家\", \"依家\", \"宜家\"]"

  for(const aWord of anthropicResults) {
    const chineseCharacters:Array<string> = aWord.split('');
    //["現", "在"]

    const aWordResponse = [];

    for(const aChineseCharacter of chineseCharacters) {
      if(await isChinese(aChineseCharacter)) {
        //await randomDelay({});
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
    }

    possibleTranslations.push(aWordResponse);
  }

  return {
    service,
    model,
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