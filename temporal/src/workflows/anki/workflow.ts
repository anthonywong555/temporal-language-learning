import { condition, defineSignal, defineUpdate, proxyActivities, setHandler } from '@temporalio/workflow';
import { createAnkiActivites } from '../../sharable-activites/anki/activities';
import * as toolActivites from '../../sharable-activites/tools/activity';
import type { LearningSessionRequest, AddWordRequest } from './types';

const { createDeck, addNote, getModelNamesAndIds } = proxyActivities<ReturnType<typeof createAnkiActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const { shuffleArray } = proxyActivities<typeof toolActivites>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

const ADD_CARD = defineSignal<[AddWordRequest]>('ADD_CARD');
const CREATE_DECK = defineSignal('CREATE_DECK');

export async function learningSession(request: LearningSessionRequest): Promise<string> {
  const { deckName } = request;
  const words:Array<AddWordRequest> = [];
  let readyToCreateDeck = false;

  await getModelNamesAndIds();

  setHandler(ADD_CARD, (aWordRequest: AddWordRequest) => {
    words.push(aWordRequest);
  });

  setHandler(CREATE_DECK, () => {
    readyToCreateDeck = true;
  });

  await condition(() => readyToCreateDeck);

  // Create the deck
  try {
    await createDeck({deck: deckName});
  } catch(e) {
    console.error(e);
  }

  // Add Chinese Cards.
  for(const aWord of words) {
    try {
      await addNote({
        note: {
          deckName,
          modelName: 'Basic 2.0',
          fields: {
            'Front': aWord.chineseText,
            'Back': aWord.englishText + '<br>' + aWord.jyutping + '<br>' + aWord.cangjie,
            'Target Text to Generate Speech': aWord.chineseText
          }
        }
      })
    } catch (e) {
      console.error(e);
    }
  }

  // Mix up the words.
  const shuffleWords = await shuffleArray(words);
  // Add English Cards.
  for(const aWord of shuffleWords) {
    try {
      await addNote({
        note: {
          deckName,
          modelName: 'Basic (type in the answer) 2.0',
          fields: {
            'Front': aWord.englishText,
            'Answer': aWord.chineseText,
            'Back': aWord.jyutping + '<br>' + aWord.cangjie,
            'Target Text to Generate Speech': aWord.chineseText
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  return '';
}