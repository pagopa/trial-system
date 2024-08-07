import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/lib/Either';
import { makeServiceBusMocks } from './mocks';
import { makeChannelAdminServiceBus } from '../channel';
import { aTrial } from '../../../../domain/__tests__/data';

const config = {
  servicebus: {
    namespace: 'aNamespace',
    names: { event: 'events' },
    resourceGroup: 'aResourceGroup',
    location: 'aLocation',
  },
};
const uuid = '0-0-0-0-0';

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
    const trialId = aTrial.id;

    const identityResponse = {
      principalId: 'aPrincipalId',
      id: 'anId',
      location: config.servicebus.location,
    };
    managedServiceIdentityClient.userAssignedIdentities.createOrUpdate.mockResolvedValueOnce(
      identityResponse,
    );

    const queueResponse = {
      id: trialId,
      name: 'aQueueName',
    };
    serviceBusManagementClient.queues.createOrUpdate.mockResolvedValueOnce(
      queueResponse,
    );

    serviceBusManagementClient.subscriptions.createOrUpdate.mockResolvedValueOnce(
      {},
    );

    serviceBusManagementClient.rules.createOrUpdate.mockResolvedValueOnce({});

    authorizationManagementClient.roleAssignments.create.mockResolvedValueOnce(
      {},
    );

    const actual = await makeChannelAdminServiceBus(
      {
        clients,
        config,
      },
      () => ({ value: uuid }),
    ).create(trialId)();

    expect(actual).toStrictEqual(
      E.right({
        queueName: queueResponse.name,
        identityId: identityResponse.id,
      }),
    );

    expect(
      managedServiceIdentityClient.userAssignedIdentities.createOrUpdate,
    ).toHaveBeenCalledWith(config.servicebus.resourceGroup, trialId, {
      location: config.servicebus.location,
    });

    expect(
      serviceBusManagementClient.queues.createOrUpdate,
    ).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      trialId,
      {},
    );

    expect(
      serviceBusManagementClient.subscriptions.createOrUpdate,
    ).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      config.servicebus.names.event,
      trialId,
      { forwardTo: queueResponse.name },
    );

    expect(
      serviceBusManagementClient.rules.createOrUpdate,
    ).toHaveBeenCalledWith(
      config.servicebus.resourceGroup,
      config.servicebus.namespace,
      config.servicebus.names.event,
      trialId,
      'FilterByTrialId',
      {
        filterType: 'CorrelationFilter',
        correlationFilter: {
          properties: {
            trialId,
          },
        },
      },
    );

    expect(
      authorizationManagementClient.roleAssignments.create,
    ).toHaveBeenCalledWith(queueResponse.id, uuid, {
      roleDefinitionId:
        '/providers/Microsoft.Authorization/roleDefinitions/4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0',
      principalId: identityResponse.principalId,
      principalType: 'ServicePrincipal',
    });
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
    managedServiceIdentityClient.userAssignedIdentities.createOrUpdate.mockRejectedValueOnce(
      error,
    );

    const actual = await makeChannelAdminServiceBus(
      {
        clients,
        config,
      },
      () => ({ value: uuid }),
    ).create(aTrial.id)();

    expect(actual).toStrictEqual(E.left(error));
  });
});
