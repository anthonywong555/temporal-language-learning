import { proxyActivities } from '@temporalio/workflow';
import type { ExampleRequest } from './types';
import type * as activities from '../../sharable-activites/example/activity';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3
  }
});

export async function example(aRequest: ExampleRequest): Promise<string> {
  const greeting = await greet(aRequest);
  return greeting;
}