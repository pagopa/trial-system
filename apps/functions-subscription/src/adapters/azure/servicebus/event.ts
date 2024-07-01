import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { ServiceBusSender } from '@azure/service-bus';
import { SubscriptionEvent } from '../../../generated/definitions/internal/SubscriptionEvent';
import { SubscriptionStateEnum } from '../../../generated/definitions/internal/SubscriptionState';
import { EventWriter } from '../../../domain/event';
import {
  SBQueue,
  SBSubscription,
  ServiceBusManagementClient,
} from '@azure/arm-servicebus';

export interface EventQueue {
  readonly createIfNotExists: (
    resourceGroup: string,
    namespace: string,
    queueName: string,
  ) => TE.TaskEither<Error, Pick<SBQueue, 'id' | 'name'>>;
}

export interface EventTopic {
  readonly createOrUpdateSubscription: (
    resourceGroupName: string,
    namespaceName: string,
    subscriptionName: string,
  ) => TE.TaskEither<Error, Pick<SBSubscription, 'id' | 'name'>>;
}

export const makeEventWriterServiceBus = (
  client: ServiceBusSender,
): EventWriter => ({
  send: (event) => {
    const state = SubscriptionStateEnum[event.state];
    // explicitly use SubscriptionEvent encoder, which is the one
    // used by the consumer to decode events
    const body = SubscriptionEvent.encode({ ...event, state });
    return TE.tryCatch(() => client.sendMessages({ body }), E.toError);
  },
});

export const makeTrialEventsServiceBusQueue = (
  managementClient: ServiceBusManagementClient,
): EventQueue => ({
  createIfNotExists: (resourceGroup, namespace, queueName) =>
    pipe(
      TE.tryCatch(
        () =>
          managementClient.queues.createOrUpdate(
            resourceGroup,
            namespace,
            queueName,
            {},
          ),
        E.toError,
      ),
    ),
});

export const makeTrialEventsServiceBusTopic = (
  client: ServiceBusManagementClient,
  topicName: string,
): EventTopic => ({
  createOrUpdateSubscription: (
    resourceGroupName,
    namespaceName,
    subscriptionName,
  ) =>
    pipe(
      TE.tryCatch(
        () =>
          client.subscriptions.createOrUpdate(
            resourceGroupName,
            namespaceName,
            topicName,
            subscriptionName,
            { forwardTo: subscriptionName },
          ),
        E.toError,
      ),
    ),
});
