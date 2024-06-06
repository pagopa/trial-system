import * as t from 'io-ts';
import * as PR from 'io-ts/PathReporter';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

export interface Config {
  readonly subscriptionRequest: {
    readonly consumer: 'on' | 'off';
  };
  readonly activations: {
    readonly job: 'on' | 'off';
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
    readonly leasesContainerName: string;
  };
}

const EnvsCodec = t.strict({
  COSMOSDB_ENDPOINT: NonEmptyString,
  COSMOSDB_DATABASE_NAME: NonEmptyString,
  COSMOSDB_LEASES_CONTAINER_NAME: NonEmptyString,
  EVENTHUB_NAMESPACE: NonEmptyString,
  SUBSCRIPTION_REQUEST_EVENTHUB_NAME: NonEmptyString,
  SUBSCRIPTION_REQUEST_CONSUMER: t.keyof({
    on: null,
    off: null,
  }),
  ACTIVATION_JOB_TRIGGER: t.keyof({
    on: null,
    off: null,
  }),
});

export const parseConfig = (
  envs: Record<string, undefined | string>,
): E.Either<string, Config> =>
  pipe(
    EnvsCodec.decode(envs),
    E.bimap(
      (errors) => PR.failure(errors).join('\n'),
      (envs) => ({
        subscriptionRequest: {
          consumer: envs.SUBSCRIPTION_REQUEST_CONSUMER,
        },
        activations: {
          job: envs.ACTIVATION_JOB_TRIGGER,
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
          leasesContainerName: envs.COSMOSDB_LEASES_CONTAINER_NAME,
        },
      }),
    ),
  );
