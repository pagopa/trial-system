import * as TE from 'fp-ts/TaskEither';
import { Subscription } from './subscription';
import { TrialId } from './trial';

export interface EventWriter {
  readonly send: (subscription: Subscription) => TE.TaskEither<Error, void>;
}

interface QueueProps {
  readonly name: string;
}

export interface EventQueue {
  readonly createIfNotExists: (
    name: string,
  ) => TE.TaskEither<Error, QueueProps>;
}

export interface EventTopic {
  readonly createSubscriptionIfTopicExists: (
    subscriptionName: TrialId,
    queueName: string,
  ) => TE.TaskEither<Error, void>;
}
