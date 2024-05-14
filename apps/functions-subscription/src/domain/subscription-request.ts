import * as TE from 'fp-ts/TaskEither';
import { TrialId, UserId } from './subscription';

/**
 * Represents a subscription request to a trial.
 */
export interface SubscriptionRequest {
  readonly userId: UserId;
  readonly trialId: TrialId;
}

/**
 * This type represents the capability to insert a subscription request
 */
export interface SubscriptionRequestWriter {
  readonly insert: (
    request: SubscriptionRequest,
  ) => TE.TaskEither<Error, SubscriptionRequest>;
}
