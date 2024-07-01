import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { EventQueue, EventTopic, EventWriter } from '../../../domain/event';
import {
  ServiceBusAdministrationClient,
  ServiceBusSender,
} from '@azure/service-bus';
import { SubscriptionEvent } from '../../../generated/definitions/internal/SubscriptionEvent';
import { SubscriptionStateEnum } from '../../../generated/definitions/internal/SubscriptionState';

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
  client: ServiceBusAdministrationClient,
): EventQueue => ({
  createIfNotExists: (name) =>
    pipe(
      TE.tryCatch(() => client.queueExists(name), E.toError),
      TE.flatMap((exists) =>
        exists
          ? TE.right({ name })
          : pipe(
              TE.tryCatch(() => client.createQueue(name), E.toError),
              TE.map(({ name }) => ({
                name,
              })),
            ),
      ),
    ),
});

export const makeTrialEventsServiceBusTopic = (
  client: ServiceBusAdministrationClient,
  topicName: string,
): EventTopic => ({
  createSubscriptionIfTopicExists: (subscriptionName, queueName) =>
    pipe(
      TE.tryCatch(() => client.topicExists(topicName), E.toError),
      TE.flatMap((exists) =>
        exists
          ? TE.tryCatch(
              () =>
                client.createSubscription(topicName, subscriptionName, {
                  forwardTo: queueName,
                }),
              E.toError,
            )
          : TE.left(new Error(`Topic ${topicName} does not exist.`)),
      ),
      TE.map(() => void 0),
    ),
});
