import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { app } from '@azure/functions';
import { parseConfig } from './config';
import { EventHubProducerClient } from '@azure/event-hubs';
import { CosmosClient } from '@azure/cosmos';
import { makeInfoHandler } from './adapters/azure/functions/info';
import { makePostSubscriptionHandler } from './adapters/azure/functions/subscriptions';
import { makeSubscriptionCosmosContainer } from './adapters/azure/cosmosdb/subscription';
import { makeSubscriptionRequestEventHubProducer } from './adapters/azure/eventhubs/subscription-request';
import { SystemEnv } from './system-env';

/**
 * FIXME: At the moment, we do not have implementations for the env.
 * To let the code properly work, we are creating an empty object.
 */
const env = {} as unknown as SystemEnv;

// the application entry-point
pipe(
  TE.Do,
  TE.apS('config', TE.fromEither(parseConfig(process.env))),
  TE.bind('cosmosDB', ({ config }) =>
    TE.of(new CosmosClient(config.subscription.cosmosdb.connectionString)),
  ),
  TE.bind('subscriptionRequestEventHub', ({ config }) =>
    TE.of(
      new EventHubProducerClient(
        config.subscriptionRequest.eventhub.connectionString,
        config.subscriptionRequest.eventhub.name,
      ),
    ),
  ),

  TE.bind('subscriptionReaderWriter', ({ config, cosmosDB }) =>
    TE.of(
      makeSubscriptionCosmosContainer(
        cosmosDB.database(config.subscription.cosmosdb.databaseName),
      ),
    ),
  ),
  TE.bind('subscriptionRequestWriter', ({ subscriptionRequestEventHub }) =>
    TE.of(makeSubscriptionRequestEventHubProducer(subscriptionRequestEventHub)),
  ),
  // eslint-disable-next-line functional/no-return-void
  TE.map(({ cosmosDB, subscriptionRequestEventHub }) => {
    app.http('info', {
      methods: ['GET'],
      authLevel: 'anonymous',
      handler: makeInfoHandler({ cosmosDB, subscriptionRequestEventHub }),
      route: 'info',
    });
    app.http('createSubscription', {
      methods: ['POST'],
      authLevel: 'anonymous',
      handler: makePostSubscriptionHandler(env),
      route: '/trials/{trialId}/subscriptions',
    });
  }),
  TE.getOrElse((error) => {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error(error);
  }),
)();
