import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { app } from '@azure/functions';
import { EventHubProducerClient } from '@azure/event-hubs';
import { CosmosClient } from '@azure/cosmos';
import { makeInfoHandler } from './adapters/azure/functions/info';
import {
  makeGetSubscriptionHandler,
  makePostSubscriptionHandler,
} from './adapters/azure/functions/subscriptions';
import { makeSubscriptionCosmosContainer } from './adapters/azure/cosmosdb/subscription';
import { makeSubscriptionRequestEventHubProducer } from './adapters/azure/eventhubs/subscription-request';
import { parseConfig } from './config';
import { Capabilities } from './domain/capabilities';
import { makeSystemEnv } from './system-env';
import { clock } from './adapters/date/clock';
import { hashFn } from './adapters/crypto/hash';

const config = pipe(
  parseConfig(process.env),
  E.getOrElseW((error) => {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error(error);
  }),
);

const cosmosDB = new CosmosClient(config.cosmosdb.connectionString);

const subscriptionRequestEventHub = new EventHubProducerClient(
  config.subscriptionRequest.eventhub.connectionString,
  config.subscriptionRequest.eventhub.name,
);

const subscriptionReaderWriter = makeSubscriptionCosmosContainer(
  cosmosDB.database(config.cosmosdb.databaseName),
);

const subscriptionRequestWriter = makeSubscriptionRequestEventHubProducer(
  subscriptionRequestEventHub,
);

const capabilities: Capabilities = {
  subscriptionReader: subscriptionReaderWriter,
  subscriptionWriter: subscriptionReaderWriter,
  subscriptionRequestWriter,
  hashFn,
  clock,
};

const env = makeSystemEnv(capabilities);

app.http('info', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: makeInfoHandler({ cosmosDB, subscriptionRequestEventHub }),
  route: 'info',
});
app.http('createSubscription', {
  methods: ['POST'],
  authLevel: 'function',
  handler: makePostSubscriptionHandler(env),
  route: '/trials/{trialId}/subscriptions',
});
app.http('getSubscription', {
  methods: ['GET'],
  authLevel: 'function',
  handler: makeGetSubscriptionHandler(env),
  route: '/trials/{trialId}/subscriptions/{userId}',
});
