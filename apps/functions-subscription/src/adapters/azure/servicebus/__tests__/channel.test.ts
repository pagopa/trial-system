import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { makeServiceBusMocks } from './mocks';
import { makeChannelAdminServiceBus } from '../channel';
import { mockFn } from 'vitest-mock-extended';
import { UUIDFn } from '../../../crypto/uuid';
import { aTrial } from '../../../../domain/__tests__/data';

const config = {
  servicebus: {
    namespace: 'aNamespace',
    names: { event: 'events' },
    resourceGroup: 'aResourceGroup',
    location: 'aLocation',
  },
};

const uuidFn = mockFn<UUIDFn>();

describe('makeChannelAdminServiceBus', () => {
  it('should return channel information', async () => {
    const {
      managedServiceIdentityClient,
      authorizationManagementClient,
      serviceBusManagementClient,
    } = makeServiceBusMocks();
    const clients = {
      managedServiceIdentityClient,
      authorizationManagementClient,
      serviceBusManagementClient,
    };

    clients.managedServiceIdentityClient.userAssignedIdentities.createOrUpdate.mockResolvedValueOnce(
      {
        principalId: 'aPrincipalId',
        id: 'anId',
        location: config.servicebus.location,
      },
    );

    clients.serviceBusManagementClient.queues.createOrUpdate.mockResolvedValueOnce(
      {
        id: 'aQueueId',
        name: 'aQueueName',
      },
    );

    clients.serviceBusManagementClient.subscriptions.createOrUpdate.mockResolvedValueOnce(
      {
        id: 'aSubscriptionId',
      },
    );

    uuidFn.mockResolvedValueOnce({ value: 'aUUID' });

    clients.authorizationManagementClient.roleAssignments.create.mockResolvedValueOnce(
      {
        id: 'anId',
      },
    );

    const actual = await makeChannelAdminServiceBus({
      clients,
      config,
      uuidGenerator: uuidFn,
    }).create(aTrial.id)();

    expect(actual).toStrictEqual(
      E.right({ queueName: 'aQueueName', identityId: 'anId' }),
    );

    // TODO: Improve expectations
  });
  it('should return an error on fail', async () => {
    const {
      managedServiceIdentityClient,
      authorizationManagementClient,
      serviceBusManagementClient,
    } = makeServiceBusMocks();
    const clients = {
      managedServiceIdentityClient,
      authorizationManagementClient,
      serviceBusManagementClient,
    };

    const error = new Error('Oh No!');
    clients.managedServiceIdentityClient.userAssignedIdentities.createOrUpdate.mockRejectedValueOnce(
      error,
    );

    const actual = await makeChannelAdminServiceBus({
      clients,
      config,
      uuidGenerator: uuidFn,
    }).create(aTrial.id)();

    expect(actual).toStrictEqual(E.left(error));
  });
});
