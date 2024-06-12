import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { EventWriter } from '../../../domain/event';
import { ServiceBusSender } from '@azure/service-bus';
import { SubscriptionEvent } from '../../../generated/definitions/internal/SubscriptionEvent';

export const makeEventWriterServiceBus = (
  client: ServiceBusSender,
): EventWriter => ({
  send: (event) => {
    // explicitly use SubscriptionEvent encoder, which is the one
    // used by the consumer to decode events
    const encoded = SubscriptionEvent.encode(event);
    return TE.tryCatch(() => client.sendMessages({ body: encoded }), E.toError);
  },
});
