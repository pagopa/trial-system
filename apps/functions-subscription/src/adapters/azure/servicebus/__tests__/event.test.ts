import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { makeServiceBusMock, makeServiceBusMocks } from './mocks';
import {
  HttpResponse,
  QueueProperties,
  ServiceBusSender,
} from '@azure/service-bus';
import { aSubscription } from '../../../../domain/__tests__/data';
import { SubscriptionEvent } from '../../../../generated/definitions/internal/SubscriptionEvent';
import {
  makeEventWriterServiceBus,
  makeTrialEventsServiceBusQueue,
} from '../event';
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

describe('makeTrialEventsServiceBusQueue', () => {
  const queueName = 'aQueueName';
  it('should not create the queue if already exists', async () => {
    const { adminClient } = makeServiceBusMocks();
    adminClient.queueExists.mockResolvedValueOnce(true);

    const actual =
      await makeTrialEventsServiceBusQueue(adminClient).createIfNotExists(
        queueName,
      )();
    const expected = E.right({ name: queueName });

    expect(adminClient.queueExists).toHaveBeenCalledWith(queueName);
    expect(adminClient.createQueue).not.toHaveBeenCalled();
    expect(actual).toStrictEqual(expected);
  });
  it('should create the queue', async () => {
    const { adminClient } = makeServiceBusMocks();
    const props = { name: queueName } as QueueProperties;
    adminClient.queueExists.mockResolvedValueOnce(false);
    adminClient.createQueue.mockResolvedValueOnce({
      _response: {} as HttpResponse,
      ...props,
    });

    const actual =
      await makeTrialEventsServiceBusQueue(adminClient).createIfNotExists(
        queueName,
      )();
    const expected = E.right({ name: queueName });

    expect(adminClient.queueExists).toHaveBeenCalledWith(queueName);
    expect(adminClient.createQueue).toHaveBeenCalledWith(queueName);
    expect(actual).toStrictEqual(expected);
  });
  it('should return an error if something went wrong', async () => {
    const { adminClient } = makeServiceBusMocks();
    const error = new Error('Oh No!');
    adminClient.queueExists.mockResolvedValueOnce(false);
    adminClient.createQueue.mockRejectedValueOnce(error);

    const actual =
      await makeTrialEventsServiceBusQueue(adminClient).createIfNotExists(
        queueName,
      )();
    const expected = E.left(error);

    expect(adminClient.queueExists).toHaveBeenCalledWith(queueName);
    expect(adminClient.createQueue).toHaveBeenCalledWith(queueName);
    expect(actual).toStrictEqual(expected);
  });
});
