import * as t from 'io-ts';
import * as PR from 'io-ts/PathReporter';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

export interface Config {
  readonly subscriptionRequest: {
    readonly eventhub: {
      readonly connectionString: string;
      readonly name: string;
    };
  };
  readonly cosmosdb: {
    readonly connectionString: string;
    readonly databaseName: string;
  };
}

const EnvsCodec = t.strict({
  COSMOSDB_CONNECTION_STRING: NonEmptyString,
  COSMOSDB_DATABASE_NAME: NonEmptyString,
  SUBSCRIPTION_REQUEST_EVENTHUB_CONNECTION_STRING: NonEmptyString,
  SUBSCRIPTION_REQUEST_EVENTHUB_NAME: NonEmptyString,
});

export const parseConfig = (
  envs: Record<string, undefined | string>,
): E.Either<string, Config> =>
  pipe(
    EnvsCodec.decode(envs),
    E.bimap(
      (errors) => PR.failure(errors).join('\n'),
      (envs) => ({
        cosmosdb: {
          connectionString: envs.COSMOSDB_CONNECTION_STRING,
          databaseName: envs.COSMOSDB_DATABASE_NAME,
        },
        subscriptionRequest: {
          eventhub: {
            connectionString:
              envs.SUBSCRIPTION_REQUEST_EVENTHUB_CONNECTION_STRING,
            name: envs.SUBSCRIPTION_REQUEST_EVENTHUB_NAME,
          },
        },
      }),
    ),
  );
