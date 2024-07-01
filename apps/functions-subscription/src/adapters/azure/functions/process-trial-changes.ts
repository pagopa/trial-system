import { InvocationContext } from '@azure/functions';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import * as t from 'io-ts';
import { TrialCodec } from '../../../domain/trial';
import { Capabilities } from '../../../domain/capabilities';
import { Config } from '../../../config';
import { nowDate } from '../../../domain/clock';

export const makeTrialChangesHandler =
  ({
    env,
    config,
  }: {
    readonly env: Pick<
      Capabilities,
      'trialWriter' | 'eventTopic' | 'eventQueue' | 'identityWriter' | 'clock'
    >;
    readonly config: Pick<Config, 'servicebus'>;
  }) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (documents: unknown, _: InvocationContext) =>
    pipe(
      TE.fromEither(t.array(TrialCodec).decode(documents)),
      TE.map(
        RA.filter(
          // Keep only the documents with same createdAt and updatedAt
          // This means the document has been created
          ({ createdAt, updatedAt }) =>
            createdAt.getTime() === updatedAt.getTime(),
        ),
      ),
      TE.flatMap(
        TE.traverseArray((trial) =>
          pipe(
            // Create user assigned managed identity
            env.identityWriter.createOrUpdate(
              trial.id,
              config.servicebus.resourceGroup,
              config.servicebus.location,
            ),
            TE.flatMap((identity) => {
              return pipe(
                // Create a queue where the events related to a trial are sent
                env.eventQueue.createIfNotExists(trial.id),
                TE.chainFirst((queueProps) =>
                  // Create a topic for the trial
                  env.eventTopic.createSubscriptionIfTopicExists(
                    trial.id,
                    queueProps.name,
                  ),
                ),
                TE.map((queueProps) => ({ queueProps, identity })),
              );
            }),
            TE.flatMap(({ identity, queueProps }) =>
              // Update the trial, changing the state and adding reference to the created resources
              pipe(
                nowDate()(env),
                TE.map((updatedAt) => ({
                  ...trial,
                  identityId: identity.id,
                  queueName: queueProps.name,
                  updatedAt,
                  state: 'CREATED' as const,
                })),
                TE.flatMap(env.trialWriter.upsert),
              ),
            ),
          ),
        ),
      ),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();
