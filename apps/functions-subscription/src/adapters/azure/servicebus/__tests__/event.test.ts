import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { makeServiceBusMocks } from './mocks';
import { aSubscription, aTrial } from '../../../../domain/__tests__/data';
import { SubscriptionEvent } from '../../../../generated/definitions/internal/SubscriptionEvent';
import {
  makeEventWriterServiceBus,
  makeTrialEventsServiceBusQueue,
  makeTrialEventsServiceBusTopic,
} from '../event';
import { SubscriptionStateEnum } from '../../../../generated/definitions/internal/SubscriptionState';

const resourceGroup = 'aResourceGroup';
const namespace = 'aNamespace';

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

describe('makeTrialEventsServiceBusQueue', () => {
  const queueName = aTrial.id;
  it('should create the queue', async () => {
    const { managementClient: client } = makeServiceBusMocks();

    client.queues.createOrUpdate.mockResolvedValueOnce({
      id: aTrial.id,
      name: queueName,
    });

    const actual = await makeTrialEventsServiceBusQueue(
      client,
    ).createIfNotExists(resourceGroup, namespace, queueName)();
    const expected = E.right({ name: queueName, id: aTrial.id });

    expect(client.queues.createOrUpdate).toHaveBeenCalledWith(
      resourceGroup,
      namespace,
      queueName,
      {},
    );
    expect(actual).toStrictEqual(expected);
  });
  it('should return an error if something went wrong', async () => {
    const { managementClient: client } = makeServiceBusMocks();
    const error = new Error('Oh No!');
    client.queues.createOrUpdate.mockRejectedValueOnce(error);

    const actual = await makeTrialEventsServiceBusQueue(
      client,
    ).createIfNotExists(resourceGroup, namespace, queueName)();
    const expected = E.left(error);

    expect(client.queues.createOrUpdate).toHaveBeenCalled();
    expect(actual).toStrictEqual(expected);
  });
  it('should return an error when missing id and principalId', async () => {
    const { managementClient: client } = makeServiceBusMocks();

    client.queues.createOrUpdate.mockResolvedValueOnce({});

    const actual = await makeTrialEventsServiceBusQueue(
      client,
    ).createIfNotExists(resourceGroup, namespace, queueName)();
    const expected = E.left(new Error('Something went wrong'));

    expect(client.queues.createOrUpdate).toHaveBeenCalledWith(
      resourceGroup,
      namespace,
      queueName,
      {},
    );
    expect(actual).toStrictEqual(expected);
  });
});

describe('makeTrialEventsServiceBusTopic', () => {
  const topicName = aTrial.id;
  const subscriptionName = aTrial.id;

  it('should create the subscription when the topic exists', async () => {
    const { managementClient: client } = makeServiceBusMocks();

    client.subscriptions.createOrUpdate.mockResolvedValueOnce({
      id: 'aSubscriptionId',
      name: subscriptionName,
    });

    const actual = await makeTrialEventsServiceBusTopic(
      client,
      topicName,
    ).createOrUpdateSubscription(resourceGroup, namespace, subscriptionName)();
    const expected = E.right({ id: 'aSubscriptionId', name: subscriptionName });

    expect(actual).toStrictEqual(expected);
    expect(client.subscriptions.createOrUpdate).toHaveBeenCalledWith(
      resourceGroup,
      namespace,
      topicName,
      subscriptionName, // Queue
      { forwardTo: subscriptionName },
    );
  });
  it('should return an error if something went wrong', async () => {
    const { managementClient: client } = makeServiceBusMocks();

    const error = new Error('Oh No!');
    client.subscriptions.createOrUpdate.mockRejectedValueOnce(error);

    const actual = await makeTrialEventsServiceBusTopic(
      client,
      topicName,
    ).createOrUpdateSubscription(resourceGroup, namespace, subscriptionName)();
    const expected = E.left(error);

    expect(actual).toStrictEqual(expected);
  });
});
