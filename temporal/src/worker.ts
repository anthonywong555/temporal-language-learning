import {
  namespace,
  taskQueue,
  getConnectionOptions,
  getWorkflowOptions,
  getTelemetryOptions,
  getenv,
  env
} from "./env";

// Anthropic
import { createAnthropicActivites } from "./sharable-activites/ai/anthropic/activites";
import { AnthropicClient } from "./sharable-activites/ai/anthropic/client";

// OpenAI
import { createOpenAIActivites } from './sharable-activites/ai/openai/activities';
import { OpenAIClient } from './sharable-activites/ai/openai/client';

// Google
import { createGoogleActivites } from "./sharable-activites/ai/google/activites";
import { GoogleClient } from "./sharable-activites/ai/google/client";

// Azure
import { createAzureActivites } from "./sharable-activites/ai/azure/activites";
import { AzureClient } from "./sharable-activites/ai/azure/client";

// Anki
import { createAnkiActivites } from "./sharable-activites/anki/activities";
import { AnkiClient } from "./sharable-activites/anki/client";

console.info(`🤖: Node_ENV = ${env}`);

import http from 'node:http';
import { NativeConnection, Runtime, Worker} from '@temporalio/worker';
import * as activities from './sharable-activites/index';

async function withOptionalStatusServer(worker: Worker, port: number | undefined, fn: () => Promise<any>): Promise<void> {
  if (port == null) {
    await fn();
    return;
  }

  const server = await new Promise<http.Server>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405, 'Method not allowed');
        res.end();
        return;
      }

      if (req.url !== '/') {
        res.writeHead(404, 'Not found');
        res.end();
        return;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(worker.getStatus()));
      res.end();

      console.info(`Health Check ✅`);
    });
    server.listen(port, () => resolve(server));
    server.once('error', reject);
  });
  console.log('Status server listening on', server?.address());
  try {
    await fn();
  } finally {
    server.close();
  }
}

async function run() {
  try {
    console.info('🤖: Temporal Worker Coming Online...');

    const connectionOptions = await getConnectionOptions();
    const telemetryOptions = getTelemetryOptions();

    if(telemetryOptions) {
      Runtime.install(telemetryOptions);
    }

    // Import Anthropic
    const ANTHROPIC_API_KEY = getenv('ANTHROPIC_API_KEY');
    const anAnthropicClient = new AnthropicClient(ANTHROPIC_API_KEY);
    const anAnthropicActivites = createAnthropicActivites(anAnthropicClient);

    // Import OpenAI
    const OPENAI_API_KEY = getenv('OPENAI_API_KEY');
    const anOpenAIClient = new OpenAIClient(OPENAI_API_KEY);
    const anOpenActivites = createOpenAIActivites(anOpenAIClient);

    // Google
    const GOOGLE_CLOUD_API_KEY = getenv('GOOGLE_CLOUD_API_KEY');
    const aGoogleClient = new GoogleClient({
      key: GOOGLE_CLOUD_API_KEY
    })
    const aGoogleActivites = createGoogleActivites(aGoogleClient);

    // Azure
    const AZURE_API_KEY = getenv('AZURE_API_KEY');
    const AZURE_REGION = getenv('AZURE_REGION');
    const AZURE_ENDPOINT = getenv('AZURE_ENDPOINT');
    const anAzureClient = new AzureClient({
      key: AZURE_API_KEY,
      region: AZURE_REGION
    }, AZURE_ENDPOINT);
    const anAzureActivites = createAzureActivites(anAzureClient);

    // Anki
    const anAnkiClient = new AnkiClient();
    const anAnkiActivites = createAnkiActivites(anAnkiClient);

    const connection = await NativeConnection.connect(connectionOptions);
    const worker = await Worker.create({
      connection,
      namespace,
      taskQueue,
      activities: {...activities, ...anAnthropicActivites, ...anOpenActivites, ...aGoogleActivites, ...anAzureActivites, ...anAnkiActivites},
      ...getWorkflowOptions(),
    });

    const statusPort = getenv('TEMPORAL_WORKER_STATUS_HTTP_PORT', '');

    if(statusPort) {
      await withOptionalStatusServer(worker, parseInt(statusPort), async () => {
        try {
          console.info(`🤖: Temporal Worker Online with HTTP Status Port 🛜! Port ${statusPort} Beep Boop Beep!`);
          await worker.run();
        } finally {
          await connection.close();
        }
      });
    } else {
      console.info('🤖: Temporal Worker Online! Beep Boop Beep!');
      await worker.run();
      await connection.close();
    }
  } catch (e) {
    console.error('🤖: ERROR!', e);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});