import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { ChannelAdmin } from '../../../domain/channel';
import { ServiceBusManagementClient } from '@azure/arm-servicebus';
import { ManagedServiceIdentityClient } from '@azure/arm-msi';
import {
  AuthorizationManagementClient,
  KnownPrincipalType,
} from '@azure/arm-authorization';
import { Config } from '../../../config';
import { uuidFn as uuidGenerator } from '../../crypto/uuid';
import { TrialId } from '../../../domain/trial';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

interface Env {
  readonly clients: {
    readonly serviceBusManagementClient: ServiceBusManagementClient;
    readonly managedServiceIdentityClient: ManagedServiceIdentityClient;
    readonly authorizationManagementClient: AuthorizationManagementClient;
  };
  readonly config: Pick<Config, 'servicebus'>;
}

const createUserAssignedIdentity = (
  trialId: TrialId,
  client: ManagedServiceIdentityClient,
  config: Env['config'],
) =>
  pipe(
    TE.tryCatch(
      () =>
        client.userAssignedIdentities.createOrUpdate(
          config.servicebus.resourceGroup,
          trialId,
          {
            location: config.servicebus.location,
          },
        ),
      E.toError,
    ),
    TE.flatMap(({ id, principalId }) =>
      id && principalId
        ? TE.right({ id, principalId })
        : TE.left(new Error('Something went wrong')),
    ),
  );

const createQueue = (
  trialId: TrialId,
  client: ServiceBusManagementClient,
  config: Env['config'],
) =>
  pipe(
    TE.tryCatch(
      () =>
        client.queues.createOrUpdate(
          config.servicebus.resourceGroup,
          config.servicebus.namespace,
          trialId,
          {},
        ),
      E.toError,
    ),
    TE.flatMap(({ id, name }) =>
      id && name
        ? TE.right({ id: id, name: name })
        : TE.left(new Error('Something went wrong')),
    ),
  );

const createTopicSubscription = (
  trialId: TrialId,
  queueName: string,
  client: ServiceBusManagementClient,
  config: Env['config'],
) =>
  TE.tryCatch(
    () =>
      client.subscriptions.createOrUpdate(
        config.servicebus.resourceGroup,
        config.servicebus.namespace,
        config.servicebus.names.event,
        trialId,
        { forwardTo: queueName },
      ),
    E.toError,
  );

const createRoleAssignment = (
  client: AuthorizationManagementClient,
  queueId: string,
  roleName: string,
  principalId: string,
) =>
  TE.tryCatch(
    () =>
      client.roleAssignments.create(queueId, roleName, {
        // Azure Service Bus Data Receiver Role Definition
        // https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/integration#azure-service-bus-data-receiver
        roleDefinitionId:
          '/providers/Microsoft.Authorization/roleDefinitions/4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0',
        principalId,
        principalType: KnownPrincipalType.ServicePrincipal,
      }),
    E.toError,
  );

export const makeChannelAdminServiceBus = (
  { clients, config }: Env,
  uuidFn = uuidGenerator,
): ChannelAdmin => ({
  create: (trialId) =>
    pipe(
      createUserAssignedIdentity(
        trialId,
        clients.managedServiceIdentityClient,
        config,
      ),
      TE.flatMap((identity) =>
        pipe(
          createQueue(trialId, clients.serviceBusManagementClient, config),
          TE.map((queue) => ({
            identity,
            queue,
          })),
        ),
      ),
      TE.chainFirst(({ queue }) =>
        createTopicSubscription(
          trialId,
          queue.name,
          clients.serviceBusManagementClient,
          config,
        ),
      ),
      TE.flatMap(({ queue, identity }) =>
        pipe(uuidFn(), (uuid) =>
          TE.right({ queue, identity, uuid: uuid.value }),
        ),
      ),
      TE.chainFirst(({ queue, identity, uuid: roleName }) =>
        createRoleAssignment(
          clients.authorizationManagementClient,
          queue.id,
          roleName,
          identity.principalId,
        ),
      ),
      TE.map(({ identity, queue }) => ({
        queueName: queue.name as NonEmptyString,
        identityId: identity.id as NonEmptyString,
      })),
    ),
});
