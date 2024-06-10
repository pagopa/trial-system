import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import {
  BulkOperationType,
  Database,
  OperationInput,
  OperationResponse,
  PatchOperationType,
} from '@azure/cosmos';
import {
  ActivationRequestItem,
  ActivationRequestItemCodec,
  ActivationResult,
  ActivationConsumer,
  BaseActivationItemCodec,
} from '../../../domain/activation';
import { decodeFromFeed } from './decode';

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
        op: PatchOperationType.incr,
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
          op: PatchOperationType.replace,
          path: `/${propertyToUpdate.toString()}`,
          value: true,
        },
      ],
    },
  });

export const makeActivationCosmosContainer = (
  db: Database,
): ActivationConsumer => {
  const container = db.container('activations');
  return {
    fetchActivationRequestItemsToActivate: ({
      trialId,
      usersToActivate,
      usersActivated,
    }) =>
      pipe(
        TE.tryCatch(
          () =>
            container.items
              .query({
                query:
                  'SELECT * FROM c WHERE c.trialId = @trialId AND c.type = "request" AND c.activated = false OFFSET 0 LIMIT @limit',
                parameters: [
                  {
                    name: '@trialId',
                    value: trialId,
                  },
                  {
                    name: '@limit',
                    value: usersToActivate - usersActivated,
                  },
                ],
              })
              .fetchAll(),
          E.toError,
        ),
        TE.flatMapEither(decodeFromFeed(ActivationRequestItemCodec)),
      ),
    activateRequestItems: (job, activationRequests) => {
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
