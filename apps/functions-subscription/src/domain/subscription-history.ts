import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import {
  Subscription,
  SubscriptionIdCodec,
  SubscriptionWithoutIdCodec,
  UserId,
} from './subscription';
import { ItemAlreadyExists } from './errors';
import { Capabilities } from './capabilities';
import { NonNegativeInteger } from '@pagopa/ts-commons/lib/numbers';
import { nowDate } from './clock';
import { TrialId } from './trial';

// a unique brand for subscriptionHistoryId
interface SubscriptionHistoryIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly SubscriptionHistoryId: unique symbol;
}
export const SubscriptionHistoryIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, SubscriptionHistoryIdBrand> =>
    str.length > 0,
  'SubscriptionHistoryId',
);
export type SubscriptionHistoryId = t.TypeOf<typeof SubscriptionHistoryIdCodec>;

export const SubscriptionHistoryCodec = t.intersection([
  t.strict({
    id: SubscriptionHistoryIdCodec,
    version: NonNegativeInteger,
  }),
  t.strict({
    subscriptionId: SubscriptionIdCodec,
  }),
  SubscriptionWithoutIdCodec,
]);
export type SubscriptionHistory = t.TypeOf<typeof SubscriptionHistoryCodec>;

/**
 * Represents the capability to write a subscription history.
 */
export interface SubscriptionHistoryWriter {
  readonly insert: (
    subscriptionHistory: SubscriptionHistory,
  ) => TE.TaskEither<Error | ItemAlreadyExists, SubscriptionHistory>;
}

export interface SubscriptionHistoryReader {
  readonly getLatest: (
    filter: Pick<SubscriptionHistory, 'subscriptionId'>,
  ) => TE.TaskEither<Error, O.Option<SubscriptionHistory>>;
}

export const makeSubscriptionHistory = (subscription: Subscription) => {
  const { trialId, userId, id: subscriptionId } = subscription;
  const version = 0 as NonNegativeInteger;
  return pipe(
    makeSubscriptionHistoryId(trialId, userId, version),
    RTE.map((id) => ({ ...subscription, id, version, subscriptionId })),
  );
};

export const makeSubscriptionHistoryNextVersion = (
  subscriptionHistory: SubscriptionHistory,
  update: Partial<Omit<SubscriptionHistory, 'id' | 'version'>>,
) => {
  const { trialId, userId, version: prevVersion } = subscriptionHistory;
  const updated = { ...subscriptionHistory, ...update };
  const version = (prevVersion + 1) as NonNegativeInteger;
  return pipe(
    RTE.Do,
    RTE.apSW('updatedAt', nowDate()),
    RTE.apSW('id', makeSubscriptionHistoryId(trialId, userId, version)),
    RTE.map(({ id, updatedAt }) => ({ ...updated, updatedAt, id, version })),
  );
};

const makeSubscriptionHistoryId = (
  trialId: TrialId,
  userId: UserId,
  version: SubscriptionHistory['version'],
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'hashFn'>>(),
    RTE.map(({ hashFn }) => hashFn(`${trialId}${userId}${version}`)),
    RTE.map(({ value }) => value as SubscriptionHistoryId),
  );

export const insertSubscriptionHistory = (
  subscriptionHistory: SubscriptionHistory,
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'subscriptionHistoryWriter'>>(),
    RTE.flatMapTaskEither(({ subscriptionHistoryWriter }) =>
      subscriptionHistoryWriter.insert(subscriptionHistory),
    ),
  );
