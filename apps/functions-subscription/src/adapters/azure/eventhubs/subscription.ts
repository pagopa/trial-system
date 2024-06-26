import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { EventHubProducerClient } from '@azure/event-hubs';
import {
  SubscriptionCodec,
  SubscriptionQueue,
} from '../../../domain/subscription';

export const makeSubscriptionQueueEventHubProducer = (
  client: EventHubProducerClient,
): SubscriptionQueue => ({
  enqueue: (request) => {
    const encoded = SubscriptionCodec.encode(request);
    return pipe(
      TE.tryCatch(() => client.sendBatch([{ body: encoded }]), E.toError),
      // if succeeded return the request
      TE.map(() => request),
    );
  },
});
