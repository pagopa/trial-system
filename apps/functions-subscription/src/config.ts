import * as t from 'io-ts';
import * as PR from 'io-ts/PathReporter';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

export interface Config {
  readonly subscriptionRequest: {
    readonly eventhub: {
      readonly namespace: string;
      readonly name: string;
    };
  };
  readonly cosmosdb: {
    readonly endpoint: string;
    readonly databaseName: string;
  };
}

const EnvsCodec = t.strict({
  COSMOSDB_ENDPOINT: NonEmptyString,
  COSMOSDB_DATABASE_NAME: NonEmptyString,
  SUBSCRIPTION_REQUEST_EVENTHUB_NAMESPACE: NonEmptyString,
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
          endpoint: envs.COSMOSDB_ENDPOINT,
          databaseName: envs.COSMOSDB_DATABASE_NAME,
        },
        subscriptionRequest: {
          eventhub: {
            namespace: envs.SUBSCRIPTION_REQUEST_EVENTHUB_NAMESPACE,
            name: envs.SUBSCRIPTION_REQUEST_EVENTHUB_NAME,
          },
        },
      }),
    ),
  );
