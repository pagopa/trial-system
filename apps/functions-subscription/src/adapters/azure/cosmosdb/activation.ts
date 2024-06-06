import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as RA from 'fp-ts/ReadonlyArray';
import * as t from 'io-ts';
import { BulkOperationType, Database, OperationInput } from '@azure/cosmos';
import {
  ActivationRequest,
  ActivationRequestCodec,
  ActivationService,
  BaseCosmosDbDocument,
} from '../../../domain/activation';
import { pipe } from 'fp-ts/lib/function';
import { cosmosErrorToDomainError } from './errors';

const makeActivationJobPatchOperation = <T extends BaseCosmosDbDocument>(
  obj: T,
  requests: readonly ActivationRequest[],
  propertyToUpdate: keyof T,
): OperationInput => ({
  id: obj.id,
  ifMatch: obj._etag,
  operationType: BulkOperationType.Patch,
  resourceBody: {
    operations: [
      {
        op: 'incr',
        path: `/${propertyToUpdate.toString()}`,
        value: requests.length,
      },
    ],
  },
});

const makeActivationRequestPatchOperation =
  <T extends BaseCosmosDbDocument>(propertyToUpdate: keyof T) =>
  (obj: T): OperationInput => ({
    id: obj.id,
    ifMatch: obj._etag,
    operationType: BulkOperationType.Patch,
    resourceBody: {
      operations: [
        {
          op: 'replace',
          path: `/${propertyToUpdate.toString()}`,
          value: true,
        },
      ],
    },
  });

export const makeActivationCosmosContainer = (
  db: Database,
): ActivationService => {
  const container = db.container('activations');
  return {
    fetchActivationRequestsToActivate: (job) =>
      pipe(
        TE.tryCatch(
          () =>
            container.items
              .query({
                query:
                  'SELECT * FROM c WHERE c.trialId = @trialId AND c.type = @type AND c.activated = @activated OFFSET @offset LIMIT @limit',
                parameters: [
                  {
                    name: '@trialId',
                    value: job.trialId,
                  },
                  {
                    name: '@type',
                    value: 'request',
                  },
                  {
                    name: '@activated',
                    value: false,
                  },
                  {
                    name: '@offset',
                    value: job.usersActivated,
                  },
                  {
                    name: '@limit',
                    value: job.usersToActivate - job.usersActivated,
                  },
                ],
              })
              .fetchAll(),
          E.toError,
        ),
        TE.map(({ resources }) => resources),
        TE.flatMapEither(t.array(ActivationRequestCodec).decode),
        TE.mapLeft(E.toError),
      ),
    activateActivationRequests: (job) => (activationRequests) =>
      pipe(
        activationRequests,
        RA.map(makeActivationRequestPatchOperation('activated')),
        RA.append(
          makeActivationJobPatchOperation(
            job,
            activationRequests,
            'usersActivated',
          ),
        ),
        TE.of,
        TE.flatMap((batchOperations) => {
          return TE.tryCatch(
            () => container.items.batch([...batchOperations], job.trialId),
            E.toError,
          );
        }),
        TE.mapBoth(cosmosErrorToDomainError, () => ({
          status: 'ok' as const,
          activated: activationRequests.length,
        })),
      ),
  };
};
