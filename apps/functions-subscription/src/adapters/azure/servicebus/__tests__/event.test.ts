import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { makeServiceBusMocks } from './mocks';
import { aSubscription } from '../../../../domain/__tests__/data';
import { SubscriptionEvent } from '../../../../generated/definitions/internal/SubscriptionEvent';
import { makeEventWriterServiceBus } from '../event';
import { SubscriptionStateEnum } from '../../../../generated/definitions/internal/SubscriptionState';

describe('makeEventWriterServiceBus', () => {
  it('should send the event without error', async () => {
    const { sender: client } = makeServiceBusMocks();

    client.sendMessages.mockResolvedValueOnce(void 0);

    const actual =
      await makeEventWriterServiceBus(client).send(aSubscription)();

    expect(actual).toStrictEqual(E.right(void 0));
    expect(client.sendMessages).toBeCalledTimes(1);
    expect(client.sendMessages).toBeCalledWith({
      body: SubscriptionEvent.encode({
        ...aSubscription,
        state: SubscriptionStateEnum.SUBSCRIBED,
      }),
    });
  });

  it('should return an error in case of failure', async () => {
    const { sender: client } = makeServiceBusMocks();
    const error = new Error('Oh No!');

    client.sendMessages.mockRejectedValueOnce(error);

    const actual =
      await makeEventWriterServiceBus(client).send(aSubscription)();

    expect(actual).toStrictEqual(E.left(error));
    expect(client.sendMessages).toBeCalledTimes(1);
  });
});
