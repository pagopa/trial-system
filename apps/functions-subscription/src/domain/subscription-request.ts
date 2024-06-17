import * as t from 'io-ts';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { TrialIdCodec, UserIdCodec } from './subscription';
import { TooManyRequestsError } from './errors';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from './capabilities';

/**
 * Represents a subscription request to a trial.
 */
export const SubscriptionRequestCodec = t.strict({
  userId: UserIdCodec,
  trialId: TrialIdCodec,
});
export type SubscriptionRequest = t.TypeOf<typeof SubscriptionRequestCodec>;

/**
 * This type represents the capability to insert a subscription request
 */
export interface SubscriptionRequestWriter {
  readonly insert: (
    request: SubscriptionRequest,
  ) => TE.TaskEither<Error | TooManyRequestsError, SubscriptionRequest>;
}

export const insertSubscriptionRequest = (
  subscriptionRequest: SubscriptionRequest,
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'subscriptionRequestWriter'>>(),
    RTE.flatMapTaskEither(({ subscriptionRequestWriter }) =>
      subscriptionRequestWriter.insert(subscriptionRequest),
    ),
  );
