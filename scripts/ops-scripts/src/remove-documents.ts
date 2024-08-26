import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import * as t from 'io-ts';
import { parseConfigOrThrow } from './parse-config';
import {
  Container,
  CosmosClient,
  OperationInput,
  SqlQuerySpec,
} from '@azure/cosmos';

const EnvsCodec = t.type({
  COSMOS_CONNECTION_STRING: NonEmptyString,
  COSMOS_DATABASE_NAME: NonEmptyString,
  TRIAL_ID: NonEmptyString,
  ITEMS_TO_REMOVE: t.keyof({ subscription: null, subscriptionHistory: null }),
});

const config = parseConfigOrThrow(EnvsCodec, process.env);

const cosmosDB = new CosmosClient(config.COSMOS_CONNECTION_STRING);

// partitionKey = id
const subscriptionContainer = cosmosDB
  .database(config.COSMOS_DATABASE_NAME)
  .container('subscription');
// partitionKey = subscriptionId
const subscriptionHistoryContainer = cosmosDB
  .database(config.COSMOS_DATABASE_NAME)
  .container('subscription-history');

const query = {
  query: `SELECT * FROM c WHERE c.trialId = @trialId OFFSET 0 LIMIT 100`,
  parameters: [{ name: '@trialId', value: config.TRIAL_ID }],
};

const runBulk = async <A, B extends OperationInput>(
  container: Container,
  query: SqlQuerySpec,
  makeOperation: (item: A) => B,
) => {
  console.log(
    `Remove ${config.ITEMS_TO_REMOVE} from '${container.id}' container`,
  );
  // eslint-disable-next-line functional/no-loop-statements
  while (true) {
    const { resources: items } = await container.items
      .query<A>(query)
      .fetchAll();

    const operations = items.map(makeOperation);

    if (items.length <= 0) break;

    const result = await container.items.bulk(operations, {
      continueOnError: false,
    });

    const count = result.filter(({ statusCode }) => statusCode === 204).length;
    const requestChargeAvg =
      result.map(({ requestCharge }) => requestCharge).reduce((p, c) => p + c) /
      result.length;
    const errors = result
      .map(({ statusCode, requestCharge }) => ({
        statusCode,
        requestCharge,
      }))
      .filter(({ statusCode }) => statusCode !== 204);

    console.log(
      `Removed ${count} items, average requestCharge per item: ${requestChargeAvg}`,
    );
    if (errors.length > 0) console.log(`Errors: ${errors}`);
  }
};

const removeSubscriptions = async () => {
  interface Subscription {
    readonly id: string;
  }
  runBulk(subscriptionContainer, query, (item: Subscription) => ({
    operationType: 'Delete' as const,
    partitionKey: item.id,
    id: item.id,
  }));
};

const removeSubscriptionHistory = async () => {
  interface SubscriptionHistory {
    readonly id: string;
    readonly subscriptionId: string;
  }
  runBulk(subscriptionHistoryContainer, query, (item: SubscriptionHistory) => ({
    operationType: 'Delete' as const,
    partitionKey: item.subscriptionId,
    id: item.id,
  }));
};

if (config.ITEMS_TO_REMOVE === 'subscription') removeSubscriptions();
else removeSubscriptionHistory();
