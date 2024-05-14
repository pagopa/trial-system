import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as TE from 'fp-ts/TaskEither';
import { Capabilities } from './capabilities';

export type SubscriptionId = string & { readonly __tag: unique symbol };
export type UserId = string & { readonly __tag: unique symbol };
export type TrialId = string & { readonly __tag: unique symbol };

export interface Subscription {
  readonly id: SubscriptionId;
  readonly userId: UserId;
  readonly trialId: TrialId;
  readonly activatedAt?: Date;
}

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
    RTE.flatMapIO(({ hashFn }) => hashFn(`${trialId}${userId}`)),
    RTE.map(({ value }) => value as SubscriptionId),
  );
