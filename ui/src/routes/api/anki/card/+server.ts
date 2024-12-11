import { Connection, Client } from '@temporalio/client';
import type { ConnectionOptions } from '@temporalio/client';
import { TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, TEMPORAL_CLIENT_CERT_PATH, TEMPORAL_CLIENT_KEY_PATH, TEMPORAL_TASK_QUEUE } from '$env/static/private';
import fs from "fs/promises";
import { json } from '@sveltejs/kit';

async function getConnectionOptions(): Promise<ConnectionOptions> {
  const address = TEMPORAL_ADDRESS ? TEMPORAL_ADDRESS : 'localhost:7233';
  let tls: ConnectionOptions["tls"] = undefined;

  if (TEMPORAL_CLIENT_CERT_PATH) {
    const crt = await fs.readFile(TEMPORAL_CLIENT_CERT_PATH);
    const key = await fs.readFile(TEMPORAL_CLIENT_KEY_PATH);

    tls = { clientCertPair: { crt, key } };
    console.info('🤖: Connecting to Temporal Cloud ⛅');
  } else {
    console.info('🤖: Connecting to Local Temporal'); 
  }

  return {
    address,
    tls
  }
}

import type { RequestHandler } from '@sveltejs/kit';

export const POST = (async ({ request }) => {
  // Create a Temporal Client
  const connection = await Connection.connect(await getConnectionOptions());

  const client = new Client({
    connection,
    namespace: TEMPORAL_NAMESPACE
  })

  // Extract the `query` from the body of the request
  const addCardRequest = await request.json();

  // Create a Temporal Workflow
  const result = await client.workflow.signalWithStart('learningSession', {
    workflowId: 'workflow-id-123',
    taskQueue: TEMPORAL_TASK_QUEUE,
    args: [{ deckName: 'testing' }],
    signal: 'ADD_CARD',
    signalArgs: [ addCardRequest ],
  });
  connection.close();

  return json({
    result
  })
}) satisfies RequestHandler;