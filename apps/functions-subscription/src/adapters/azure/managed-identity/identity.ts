import * as TE from 'fp-ts/lib/TaskEither';
import { Identity, ManagedServiceIdentityClient } from '@azure/arm-msi';
import { AuthorizationManagementClient } from '@azure/arm-authorization';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/function';

export interface IdentityWriter {
  readonly createOrUpdate: (
    name: string,
    resourceGroup: string,
    location: string,
  ) => TE.TaskEither<Error, Pick<Identity, 'id' | 'principalId'>>;
  readonly assignRole: (
    scope: string,
    roleAssignmentName: string,
    roleDefinitionId: string,
    principalId: string,
  ) => TE.TaskEither<Error, void>;
}

export const makeIdentityWriter = (
  identityClient: ManagedServiceIdentityClient,
  authManagementClient: AuthorizationManagementClient,
): IdentityWriter => ({
  createOrUpdate: (name, resourceGroup, location) =>
    pipe(
      TE.tryCatch(
        () =>
          identityClient.userAssignedIdentities.createOrUpdate(
            resourceGroup,
            name,
            {
              location,
            },
          ),
        E.toError,
      ),
    ),
  assignRole: (scope, roleAssignmentName, roleDefinitionId, principalId) =>
    pipe(
      TE.tryCatch(
        () =>
          authManagementClient.roleAssignments.create(
            scope,
            roleAssignmentName,
            {
              roleDefinitionId,
              principalId,
              principalType: 'ServicePrincipal',
            },
          ),
        E.toError,
      ),
      TE.map(() => void 0),
    ),
});
