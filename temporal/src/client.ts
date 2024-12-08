import { Connection, Client } from '@temporalio/client';
import { translateCantonese } from './workflows/translation/cantonese/workflow';
import { nanoid } from 'nanoid';
import { getConnectionOptions, getenv, namespace, taskQueue } from './env';
import type { TranslationRequestCantonese } from './workflows/translation/types';

async function run() {
  const connection = await Connection.connect(await getConnectionOptions());

  const client = new Client({
    connection,
    namespace
  });

  const workflowId = `workflow-${nanoid()}`;

  const text = '我己經吃飯了';
  const aRequest:TranslationRequestCantonese = {
    text
  };

  const result = await client.workflow.start(translateCantonese, {
    taskQueue,
    args: [aRequest],
    workflowId: workflowId
  });

  console.log(`Start a workflow`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});