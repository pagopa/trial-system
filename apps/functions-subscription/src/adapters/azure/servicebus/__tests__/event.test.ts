import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { makeServiceBusMock } from './mocks';
import { ServiceBusSender } from '@azure/service-bus';
import { aSubscription } from '../../../../domain/__tests__/data';
import { SubscriptionEvent } from '../../../../generated/definitions/internal/SubscriptionEvent';
import { makeEventWriterServiceBus } from '../event';
import { SubscriptionStateEnum } from '../../../../generated/definitions/internal/SubscriptionState';

describe('makeEventWriterServiceBus', () => {
  it('should send the event without error', async () => {
    const mock = makeServiceBusMock();
    const client = mock as unknown as ServiceBusSender;

    mock.sendMessages.mockResolvedValueOnce(void 0);

    const actual =
      await makeEventWriterServiceBus(client).send(aSubscription)();

    expect(actual).toStrictEqual(E.right(void 0));
    expect(mock.sendMessages).toBeCalledTimes(1);
    expect(mock.sendMessages).toBeCalledWith({
      body: SubscriptionEvent.encode({
        ...aSubscription,
        state: SubscriptionStateEnum.SUBSCRIBED,
      }),
    });
  });

  it('should return an error in case of failure', async () => {
    const mock = makeServiceBusMock();
    const client = mock as unknown as ServiceBusSender;
    const error = new Error('Oh No!');

    mock.sendMessages.mockRejectedValueOnce(error);

    const actual =
      await makeEventWriterServiceBus(client).send(aSubscription)();

    expect(actual).toStrictEqual(E.left(error));
    expect(mock.sendMessages).toBeCalledTimes(1);
  });
});
