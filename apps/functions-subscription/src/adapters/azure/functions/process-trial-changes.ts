import { InvocationContext } from '@azure/functions';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as RA from 'fp-ts/ReadonlyArray';
import * as t from 'io-ts';
import { TrialCodec } from '../../../domain/trial';
import { Capabilities } from '../../../domain/capabilities';
import { Config } from '../../../config';

export const makeTrialChangesHandler =
  ({
    env,
    config,
  }: {
    readonly env: Pick<
      Capabilities,
      'trialWriter' | 'eventTopic' | 'eventQueue' | 'identityWriter' | 'uuidFn'
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
          ({ state }) => state === 'CREATING',
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
            TE.flatMap((identity) =>
              pipe(
                // Create a queue where the events related to a trial are sent
                env.eventQueue.createIfNotExists(
                  config.servicebus.resourceGroup,
                  config.servicebus.namespace,
                  trial.id,
                ),
                TE.flatMap((queue) =>
                  // Create a subscription for the trial
                  pipe(
                    env.eventTopic.createOrUpdateSubscription(
                      config.servicebus.resourceGroup,
                      config.servicebus.namespace,
                      trial.id,
                    ),
                    TE.map(() => ({
                      identity,
                      queue,
                    })),
                  ),
                ),
              ),
            ),
            TE.flatMap(({ identity, queue }) =>
              pipe(
                env.identityWriter.assignRole(
                  queue.id,
                  env.uuidFn().value,
                  // Azure Service Bus Data Receiver Role Definition
                  // https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/integration#azure-service-bus-data-receiver
                  '/providers/Microsoft.Authorization/roleDefinitions/4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0',
                  identity.principalId,
                ),
                TE.map(() => ({ identityId: identity.id })),
              ),
            ),
            TE.flatMap(({ identityId }) =>
              // Update the trial, changing the state and adding reference to the created resources
              env.trialWriter.upsert({
                ...trial,
                identityId,
                state: 'CREATED' as const,
              }),
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
