import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as TE from 'fp-ts/TaskEither';
import { Capabilities } from './capabilities';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { ItemAlreadyExists, TooManyRequestsError } from './errors';

export type SubscriptionId = NonEmptyString & { readonly __tag: unique symbol };
export type UserId = NonEmptyString & { readonly __tag: unique symbol };
export type TrialId = NonEmptyString & { readonly __tag: unique symbol };

export type SubscriptionState =
  | 'UNSUBSCRIBED'
  | 'SUBSCRIBED'
  | 'ACTIVE'
  | 'DISABLED';

export interface Subscription {
  readonly id: SubscriptionId;
  readonly userId: UserId;
  readonly trialId: TrialId;
  readonly activatedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly state: SubscriptionState;
}

/**
 * This type represents the capability do get a subscription.
 */
export interface SubscriptionReader {
  readonly get: (
    id: SubscriptionId,
  ) => TE.TaskEither<Error | TooManyRequestsError, O.Option<Subscription>>;
}

/**
 * This type represents the capability do write a subscription.
 */
export interface SubscriptionWriter {
  readonly insert: (
    subscription: Subscription,
  ) => TE.TaskEither<
    Error | TooManyRequestsError | ItemAlreadyExists,
    Subscription
  >;
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