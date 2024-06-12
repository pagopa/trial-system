import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { app } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';
import { EventHubProducerClient } from '@azure/event-hubs';
import { CosmosClient } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { makeInfoHandler } from './adapters/azure/functions/info';
import { makePostSubscriptionHandler } from './adapters/azure/functions/insert-subscription';
import { makeGetSubscriptionHandler } from './adapters/azure/functions/get-subscription';
import { makeSubscriptionCosmosContainer } from './adapters/azure/cosmosdb/subscription';
import { makeSubscriptionRequestEventHubProducer } from './adapters/azure/eventhubs/subscription-request';
import { parseConfig } from './config';
import { Capabilities } from './domain/capabilities';
import { makeSystemEnv } from './system-env';
import { clock } from './adapters/date/clock';
import { hashFn } from './adapters/crypto/hash';
import { makeSubscriptionHistoryCosmosContainer } from './adapters/azure/cosmosdb/subscription-history';
import { makeSubscriptionRequestConsumerHandler } from './adapters/azure/functions/process-subscription-request';
import { makeSubscriptionHistoryChangesHandler } from './adapters/azure/functions/process-subscription-history-changes';
import { makeActivationJobConsumerHandler } from './adapters/azure/functions/activation-job';
import { makeActivationRequestRepository } from './adapters/azure/cosmosdb/activation-request';
import { makeEventsProducerCosmosDBHandler } from './adapters/azure/functions/events-producer';
import { makeEventWriterServiceBus } from './adapters/azure/servicebus/event';

const config = pipe(
  parseConfig(process.env),
  E.getOrElseW((error) => {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error(error);
  }),
);

const cosmosDB = new CosmosClient({
  endpoint: config.cosmosdb.endpoint,
  aadCredentials: new DefaultAzureCredential(),
});

const subscriptionRequestEventHub = new EventHubProducerClient(
  config.eventhubs.namespace,
  config.eventhubs.names.subscriptionRequest,
  new DefaultAzureCredential(),
);

const serviceBus = new ServiceBusClient(
  config.servicebus.namespace,
  new DefaultAzureCredential(),
);

const subscriptionReaderWriter = makeSubscriptionCosmosContainer(
  cosmosDB.database(config.cosmosdb.databaseName),
);

const subscriptionHistoryWriter = makeSubscriptionHistoryCosmosContainer(
  cosmosDB.database(config.cosmosdb.databaseName),
);

const subscriptionRequestWriter = makeSubscriptionRequestEventHubProducer(
  subscriptionRequestEventHub,
);

const activationRequestRepository = makeActivationRequestRepository(
  cosmosDB.database(config.cosmosdb.databaseName),
);

const eventWriter = makeEventWriterServiceBus(
  serviceBus.createSender(config.servicebus.names.event),
);

const capabilities: Capabilities = {
  subscriptionReader: subscriptionReaderWriter,
  subscriptionWriter: subscriptionReaderWriter,
  subscriptionRequestWriter,
  subscriptionHistoryWriter,
  activationRequestRepository,
  eventWriter,
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

if (config.subscriptionRequest.consumer === 'on')
  app.eventHub('subscriptionRequestConsumer', {
    connection: 'SubscriptionRequestEventHubConnection',
    eventHubName: config.eventhubs.names.subscriptionRequest,
    cardinality: 'many',
    handler: makeSubscriptionRequestConsumerHandler(env),
  });

if (config.subscriptionHistory.consumer === 'on')
  app.cosmosDB('subscriptionHistoryConsumer', {
    connection: 'SubscriptionHistoryCosmosConnection',
    databaseName: config.cosmosdb.databaseName,
    containerName: config.cosmosdb.containersNames.subscriptionHistory,
    leaseContainerName: config.cosmosdb.containersNames.leases,
    leaseContainerPrefix: 'subscriptionHistoryConsumer-',
    handler: makeSubscriptionHistoryChangesHandler(capabilities),
  });

if (config.activations.consumer === 'on')
  app.cosmosDB('activationConsumer', {
    connection: 'ActivationConsumerCosmosDBConnection',
    databaseName: config.cosmosdb.databaseName,
    containerName: config.cosmosdb.containersNames.activations,
    leaseContainerName: config.cosmosdb.containersNames.leases,
    leaseContainerPrefix: `${config.cosmosdb.containersNames.activations}-`,
    handler: makeActivationJobConsumerHandler(
      env,
      config.activations.maxFetchSize,
    ),
  });

if (config.events.producer === 'on')
  app.cosmosDB('eventProducer', {
    connection: 'SubscriptionHistoryCosmosConnection',
    databaseName: config.cosmosdb.databaseName,
    containerName: config.cosmosdb.containersNames.subscriptionHistory,
    leaseContainerName: config.cosmosdb.containersNames.leases,
    leaseContainerPrefix: 'eventProducer-',
    handler: makeEventsProducerCosmosDBHandler(capabilities),
  });
