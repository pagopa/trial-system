import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { EventHubProducerClient } from '@azure/event-hubs';
import { SubscriptionRequestWriter } from '../../../domain/subscription-request';

export const makeSubscriptionRequestEventHubProducer = (
  client: EventHubProducerClient,
): SubscriptionRequestWriter => ({
  insert: (request) =>
    pipe(
      TE.tryCatch(() => client.sendBatch([{ body: request }]), E.toError),
      // if succeeded return the request
      TE.map(() => request),
    ),
});
