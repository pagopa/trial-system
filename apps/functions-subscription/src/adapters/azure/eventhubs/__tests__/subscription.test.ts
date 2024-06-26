import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { makeEventHubMock } from './mocks';
import { makeSubscriptionQueueEventHubProducer } from '../subscription';
import { EventHubProducerClient } from '@azure/event-hubs';
import { aSubscription } from '../../../../domain/__tests__/data';
import { SubscriptionCodec } from '../../../../domain/subscription';

describe('makeSubscriptionQueueEventHubProducer', () => {
  it('should return the item if succeeded', async () => {
    const mockEventHub = makeEventHubMock();

    mockEventHub.sendBatch.mockResolvedValueOnce(void 0);

    const actual = await makeSubscriptionQueueEventHubProducer(
      mockEventHub as unknown as EventHubProducerClient,
    ).enqueue(aSubscription)();

    expect(actual).toStrictEqual(E.right(aSubscription));
    expect(mockEventHub.sendBatch).toBeCalledWith([
      { body: SubscriptionCodec.encode(aSubscription) },
    ]);
  });

  it('should return error if failed', async () => {
    const mockEventHub = makeEventHubMock();
    const error = new Error('Oh No!');

    mockEventHub.sendBatch.mockRejectedValueOnce(error);

    const actual = await makeSubscriptionQueueEventHubProducer(
      mockEventHub as unknown as EventHubProducerClient,
    ).enqueue(aSubscription)();

    expect(actual).toStrictEqual(E.left(error));
  });
});
