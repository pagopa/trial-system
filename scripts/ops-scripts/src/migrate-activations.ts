import * as t from 'io-ts';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { parseConfigOrThrow } from './parse-config';
import { CosmosClient } from '@azure/cosmos';

const EnvsCodec = t.type({
  COSMOS_CONNECTION_STRING: NonEmptyString,
  COSMOS_DATABASE_NAME: NonEmptyString,
  FROM_CONTAINER_NAME: NonEmptyString,
  TO_CONTAINER_NAME: NonEmptyString,
  TRIAL_ID: NonEmptyString,
});

const config = parseConfigOrThrow(EnvsCodec, process.env);

const cosmosDB = new CosmosClient(config.COSMOS_CONNECTION_STRING);

const fromCosmosContainer = cosmosDB
  .database(config.COSMOS_DATABASE_NAME)
  .container(config.FROM_CONTAINER_NAME);
const toCosmosContainer = cosmosDB
  .database(config.COSMOS_DATABASE_NAME)
  .container(config.TO_CONTAINER_NAME);

const runActivationMigration = async () => {
  console.log(
    `Migrate all items of '${config.TRIAL_ID}' from '${fromCosmosContainer.id}' to '${toCosmosContainer.id}'\n`,
  );

  // eslint-disable-next-line functional/prefer-readonly-type
  const items = fromCosmosContainer.items.query<{ activated?: boolean }>({
    query: `SELECT * FROM c WHERE c.trialId = @trialId`,
    parameters: [{ name: '@trialId', value: config.TRIAL_ID }],
  });

  // eslint-disable-next-line functional/no-loop-statements
  for await (const { resources: elems } of items.getAsyncIterator()) {
    const operations = elems
      .map((elem) => {
        if (elem.activated === true) {
          return { ...elem, state: 'ACTIVE' };
        } else if (elem.activated === false) {
          return { ...elem, state: 'SUBSCRIBED' };
        } else {
          return elem;
        }
      })
      .map((migrated) => {
        // eslint-disable-next-line functional/immutable-data
        delete migrated.activated;
        return migrated;
      })
      .map((migrated) => ({
        operationType: 'Create' as const,
        resourceBody: migrated,
      }));

    const result = await toCosmosContainer.items.bulk(operations, {
      continueOnError: true,
    });

    console.log(
      JSON.stringify(
        result.map(({ statusCode, resourceBody }) => ({
          statusCode,
          id: resourceBody?.id,
        })),
        null,
        2,
      ),
    );
  }

  console.log('\nDone');
};

runActivationMigration();
