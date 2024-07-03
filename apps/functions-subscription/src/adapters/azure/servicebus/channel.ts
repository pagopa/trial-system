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
import { UUIDFn } from '../../crypto/uuid';

interface Env {
  readonly clients: {
    readonly serviceBusManagementClient: ServiceBusManagementClient;
    readonly managedServiceIdentityClient: ManagedServiceIdentityClient;
    readonly authorizationManagementClient: AuthorizationManagementClient;
  };
  readonly config: Pick<Config, 'servicebus'>;
  readonly uuidGenerator: UUIDFn;
}

export const makeChannelAdminServiceBus = ({
  clients,
  config,
  uuidGenerator,
}: Env): ChannelAdmin => ({
  create: (trialId) =>
    pipe(
      TE.tryCatch(
        () =>
          clients.managedServiceIdentityClient.userAssignedIdentities.createOrUpdate(
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
      TE.flatMap((identity) =>
        pipe(
          TE.tryCatch(
            () =>
              clients.serviceBusManagementClient.queues.createOrUpdate(
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
          TE.map((queue) => ({
            identity,
            queue,
          })),
        ),
      ),
      TE.chainFirst(({ queue }) =>
        pipe(
          TE.tryCatch(
            () =>
              clients.serviceBusManagementClient.subscriptions.createOrUpdate(
                config.servicebus.resourceGroup,
                config.servicebus.namespace,
                config.servicebus.names.event,
                trialId,
                { forwardTo: queue.name },
              ),
            E.toError,
          ),
        ),
      ),
      TE.chainFirst(({ queue, identity }) =>
        pipe(
          TE.tryCatch(
            () =>
              clients.authorizationManagementClient.roleAssignments.create(
                queue.id,
                uuidGenerator().value,
                {
                  // Azure Service Bus Data Receiver Role Definition
                  // https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/integration#azure-service-bus-data-receiver
                  roleDefinitionId:
                    '/providers/Microsoft.Authorization/roleDefinitions/4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0',
                  principalId: identity.principalId,
                  principalType: KnownPrincipalType.ServicePrincipal,
                },
              ),
            E.toError,
          ),
        ),
      ),
      TE.map(({ identity, queue }) => ({
        queueName: queue.name,
        identityId: identity.id,
      })),
    ),
});
