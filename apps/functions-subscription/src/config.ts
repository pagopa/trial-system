import * as t from 'io-ts';
import * as PR from 'io-ts/PathReporter';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import {
  NumberFromString,
  WithinRangeInteger,
} from '@pagopa/ts-commons/lib/numbers';

export interface Config {
  readonly subscriptionHistory: {
    readonly consumer: 'on' | 'off';
  };
  readonly subscriptionRequest: {
    readonly consumer: 'on' | 'off';
  };
  readonly activations: {
    readonly consumer: 'on' | 'off';
    readonly maxFetchSize: number;
  };
  readonly eventhubs: {
    readonly namespace: string;
    readonly names: {
      readonly subscriptionRequest: string;
    };
  };
  readonly cosmosdb: {
    readonly endpoint: string;
    readonly databaseName: string;
    readonly containersNames: {
      readonly leases: string;
      readonly subscriptionHistory: string;
    };
  };
}

const OnOrOffCodec = t.keyof({
  on: null,
  off: null,
});

const EnvsCodec = t.strict({
  COSMOSDB_ENDPOINT: NonEmptyString,
  COSMOSDB_DATABASE_NAME: NonEmptyString,
  LEASES_COSMOSDB_CONTAINER_NAME: NonEmptyString,
  EVENTHUB_NAMESPACE: NonEmptyString,
  SUBSCRIPTION_REQUEST_CONSUMER: OnOrOffCodec,
  SUBSCRIPTION_REQUEST_EVENTHUB_NAME: NonEmptyString,
  SUBSCRIPTION_HISTORY_CONSUMER: OnOrOffCodec,
  SUBSCRIPTION_HISTORY_COSMOSDB_CONTAINER_NAME: NonEmptyString,
  ACTIVATION_CONSUMER: OnOrOffCodec,
  ACTIVATION_MAX_FETCH_SIZE: NumberFromString.pipe(WithinRangeInteger(1, 1000)),
});

export const parseConfig = (
  envs: Record<string, undefined | string>,
): E.Either<string, Config> =>
  pipe(
    EnvsCodec.decode(envs),
    E.bimap(
      (errors) => PR.failure(errors).join('\n'),
      (envs) => ({
        subscriptionHistory: {
          consumer: envs.SUBSCRIPTION_HISTORY_CONSUMER,
        },
        subscriptionRequest: {
          consumer: envs.SUBSCRIPTION_REQUEST_CONSUMER,
        },
        activations: {
          consumer: envs.ACTIVATION_CONSUMER,
          maxFetchSize: envs.ACTIVATION_MAX_FETCH_SIZE,
        },
        eventhubs: {
          namespace: envs.EVENTHUB_NAMESPACE,
          names: {
            subscriptionRequest: envs.SUBSCRIPTION_REQUEST_EVENTHUB_NAME,
          },
        },
        cosmosdb: {
          endpoint: envs.COSMOSDB_ENDPOINT,
          databaseName: envs.COSMOSDB_DATABASE_NAME,
          containersNames: {
            leases: envs.LEASES_COSMOSDB_CONTAINER_NAME,
            subscriptionHistory:
              envs.SUBSCRIPTION_HISTORY_COSMOSDB_CONTAINER_NAME,
          },
        },
      }),
    ),
  );
