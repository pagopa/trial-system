import * as TE from 'fp-ts/lib/TaskEither';
import {
  ManagedServiceIdentityClient,
  UserAssignedIdentitiesCreateOrUpdateResponse,
} from '@azure/arm-msi';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/function';

type IdentityProps = Exclude<
  UserAssignedIdentitiesCreateOrUpdateResponse,
  'tags' | 'type'
>;

export interface IdentityWriter {
  readonly createOrUpdate: (
    name: string,
    resourceGroup: string,
    location: string,
  ) => TE.TaskEither<Error, IdentityProps>;
}

export const makeIdentityWriter = (
  client: ManagedServiceIdentityClient,
): IdentityWriter => ({
  createOrUpdate: (name, resourceGroup, location) =>
    pipe(
      TE.tryCatch(
        () =>
          client.userAssignedIdentities.createOrUpdate(resourceGroup, name, {
            location,
          }),
        E.toError,
      ),
    ),
});
