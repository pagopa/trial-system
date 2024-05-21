import * as t from 'io-ts';
import * as TE from 'fp-ts/TaskEither';
import { TrialIdCodec, UserIdCodec } from './subscription';
import { TooManyRequestsError } from './errors';

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
