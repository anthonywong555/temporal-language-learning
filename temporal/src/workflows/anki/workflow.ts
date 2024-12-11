import { condition, defineSignal, defineUpdate, proxyActivities, setHandler } from '@temporalio/workflow';
import { createAnkiActivites } from '../../sharable-activites//anki/activities';
import type { LearningSessionRequest, AddWordRequest } from './types';

const { getDeckNames, getDecks } = proxyActivities<ReturnType<typeof createAnkiActivites>>({
  scheduleToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
})

const ADD_CARD = defineSignal<[AddWordRequest]>('ADD_CARD');
const CREATE_DECK = defineSignal('CREATE_DECK');

export async function learningSession(request: LearningSessionRequest): Promise<string> {
  const words:Array<AddWordRequest> = [];
  let createDeck = false;

  setHandler(ADD_CARD, (aWordRequest: AddWordRequest) => {
    words.push(aWordRequest);
  });

  setHandler(CREATE_DECK, () => {
    createDeck = true;
  });

  await condition(() => createDeck);

  console.log(words);
}