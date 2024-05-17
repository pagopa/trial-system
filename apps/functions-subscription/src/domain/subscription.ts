import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as TE from 'fp-ts/TaskEither';
import { Capabilities } from './capabilities';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

// a unique brand for subscriptionId
interface SubscriptionIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly SubscriptionId: unique symbol;
}
export const SubscriptionIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, SubscriptionIdBrand> =>
    str.length > 0,
  'SubscriptionId',
);
export type SubscriptionId = t.TypeOf<typeof SubscriptionIdCodec>;

// a unique brand for userId
interface UserIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly UserId: unique symbol;
}
export const UserIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, UserIdBrand> => str.length > 0,
  'UserId',
);
export type UserId = t.TypeOf<typeof UserIdCodec>;

// a unique brand for trialId
interface TrialIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly TrialId: unique symbol;
}
export const TrialIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, TrialIdBrand> => str.length > 0,
  'TrialId',
);
export type TrialId = t.TypeOf<typeof TrialIdCodec>;

export const SubscriptionCodec = t.intersection([
  t.strict({
    id: SubscriptionIdCodec,
    userId: UserIdCodec,
    trialId: TrialIdCodec,
    createdAt: IsoDateFromString,
    updatedAt: IsoDateFromString,
    state: t.keyof({
      UNSUBSCRIBED: null,
      SUBSCRIBED: null,
      ACTIVE: null,
      DISABLED: null,
    }),
  }),
  t.partial({
    activatedAt: IsoDateFromString,
  }),
]);
export type Subscription = t.TypeOf<typeof SubscriptionCodec>;

/**
 * This type represents the capability do get a subscription.
 */
export interface SubscriptionReader {
  readonly get: (
    id: SubscriptionId,
  ) => TE.TaskEither<Error, O.Option<Subscription>>;
}

/**
 * This type represents the capability do write a subscription.
 */
export interface SubscriptionWriter {
  readonly insert: (
    subscription: Subscription,
  ) => TE.TaskEither<Error, Subscription>;
}

/**
 * This function is useful to create a subscription id.
 */
export const makeSubscriptionId = (trialId: TrialId, userId: UserId) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'hashFn'>>(),
    RTE.map(({ hashFn }) => hashFn(`${trialId}${userId}`)),
    RTE.map(({ value }) => value as SubscriptionId),
  );
