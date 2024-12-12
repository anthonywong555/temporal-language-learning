import { condition, defineSignal, defineUpdate, proxyActivities, setHandler } from '@temporalio/workflow';
import { createAnkiActivites } from '../../sharable-activites//anki/activities';
import type { LearningSessionRequest, AddWordRequest } from './types';

const { createDeck, addNote, getModelNamesAndIds } = proxyActivities<ReturnType<typeof createAnkiActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
})

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
  console.log(words);

  return '';
}