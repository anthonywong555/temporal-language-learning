import { Connection, Client } from '@temporalio/client';
import { example } from './workflows/example/workflow';
import { nanoid } from 'nanoid';
import { getConnectionOptions, getenv, namespace, taskQueue } from './env';
import type { ExampleRequest } from './workflows/example/types';

async function run() {
  const connection = await Connection.connect(await getConnectionOptions());

  const client = new Client({
    connection,
    namespace
  });

  const workflowId = `workflow-${nanoid()}`;

  const name = 'World';
  const aExampleRequest:ExampleRequest = {
    name
  };

  const result = await client.workflow.execute(example, {
    taskQueue,
    args: [aExampleRequest],
    workflowId: workflowId
  });

  console.log(`Result: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});