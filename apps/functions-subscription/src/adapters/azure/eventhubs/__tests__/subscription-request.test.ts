import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { makeEventHubMock } from './mocks';
import { makeSubscriptionRequestEventHubProducer } from '../subscription-request';
import { EventHubProducerClient } from '@azure/event-hubs';
import { aSubscriptionRequest } from '../../../../domain/__tests__/data';
import { SubscriptionRequestCodec } from '../../../../domain/subscription-request';

describe('makeSubscriptionRequestEventHubProducer', () => {
  it('should return the item if succeeded', async () => {
    const mockEventHub = makeEventHubMock();

    mockEventHub.sendBatch.mockResolvedValueOnce(void 0);

    const actual = await makeSubscriptionRequestEventHubProducer(
      mockEventHub as unknown as EventHubProducerClient,
    ).insert(aSubscriptionRequest)();
    const expected = E.right(aSubscriptionRequest);

    expect(actual).toStrictEqual(expected);
    expect(mockEventHub.sendBatch).toBeCalledWith([
      { body: SubscriptionRequestCodec.encode(aSubscriptionRequest) },
    ]);
  });

  it('should return error if failed', async () => {
    const mockEventHub = makeEventHubMock();
    const error = new Error('Oh No!');

    mockEventHub.sendBatch.mockRejectedValueOnce(error);

    const actual = await makeSubscriptionRequestEventHubProducer(
      mockEventHub as unknown as EventHubProducerClient,
    ).insert(aSubscriptionRequest)();
    const expected = E.left(error);

    expect(actual).toStrictEqual(expected);
  });
});
