import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { EventWriter } from '../../../domain/event';
import { ServiceBusSender } from '@azure/service-bus';
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
