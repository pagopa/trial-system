import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import {
  BulkOperationType,
  Database,
  OperationInput,
  OperationResponse,
} from '@azure/cosmos';
import {
  ActivationRequestItem,
  ActivationRequestItemCodec,
  ActivationResult,
  ActivationService,
  BaseActivationItemCodec,
} from '../../../domain/activation';

const makeActivationJobPatchOperation = <T extends BaseActivationItemCodec>(
  obj: T,
  requests: readonly ActivationRequestItem[],
  propertyToUpdate: keyof T,
): OperationInput => ({
  id: obj.id,
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
  <T extends BaseActivationItemCodec>(propertyToUpdate: keyof T) =>
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
        TE.flatMapEither(t.array(ActivationRequestItemCodec).decode),
        TE.mapLeft(E.toError),
      ),
    activateActivationRequests: (job) => (activationRequests) => {
      const batchOperations =
        activationRequests.length === 0 // If array is empty, no operations
          ? []
          : [
              // Convert activation request to the patch operation to update the activated field
              ...activationRequests.map(
                makeActivationRequestPatchOperation('activated'),
              ),
              // Convert job to the patch operation to update the counter
              makeActivationJobPatchOperation(
                job,
                activationRequests,
                'usersActivated',
              ),
            ];
      // If array is empty, just return ok; otherwise try the batch operation
      return batchOperations.length === 0
        ? TE.of('not-executed')
        : pipe(
            TE.tryCatch(
              () => container.items.batch(batchOperations, job.trialId),
              E.toError,
            ),
            TE.map(({ result }) => makeActivationResult(result)),
          );
    },
  };
};

const makeActivationResult = (
  arr: readonly OperationResponse[] | undefined,
): ActivationResult => {
  return arr && arr.every(({ statusCode }) => statusCode === 200)
    ? 'success'
    : 'fail';
};
