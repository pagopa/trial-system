import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { pipe } from 'fp-ts/lib/function';
import {
  BulkOperationType,
  Database,
  OperationInput,
  OperationResponse,
  PatchOperationType,
} from '@azure/cosmos';
import {
  ActivationRequest,
  ActivationRequestCodec,
  ActivationRequestRepository,
  ActivationResult,
} from '../../../domain/activation-request';
import { decodeFromFeed } from './decode';
import { ActivationJobId } from '../../../domain/activation-job';
import { cosmosErrorToDomainError } from './errors';

export const makeActivationRequestRepository = (
  db: Database,
): ActivationRequestRepository => {
  const container = db.container('activations');
  return {
    insert: (activationRequest) =>
      pipe(
        TE.tryCatch(() => container.items.create(activationRequest), E.toError),
        TE.flatMapEither(({ resource }) =>
          pipe(resource, ActivationRequestCodec.decode, E.mapLeft(E.toError)),
        ),
        TE.mapLeft(cosmosErrorToDomainError),
      ),
    list: (trialId, elementsToFetch) =>
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
                    value: elementsToFetch,
                  },
                ],
              })
              .fetchAll(),
          E.toError,
        ),
        TE.flatMapEither(decodeFromFeed(ActivationRequestCodec)),
      ),
    activate: ({ id: jobId, trialId }, activationRequests) =>
      pipe(
        activationRequests,
        // Split in chunks
        // Transactional batch can handle only 100 items per batch.
        // Since one item must be the update of the job, we can handle
        // batches of 99 items.
        // https://learn.microsoft.com/en-us/javascript/api/@azure/cosmos/items?view=azure-node-latest#@azure-cosmos-items-batch
        RA.chunksOf(99),
        RA.map(makeBatchOperations(jobId)),
        TE.traverseArray((chunk) => {
          if (activationRequests.length > 0)
            return pipe(
              TE.tryCatch(
                () => container.items.batch([...chunk], trialId),
                E.toError,
              ),
              TE.map(({ result }) => result ?? []),
            );
          else return TE.of([]);
        }),
        TE.map(RA.flatten),
        TE.map(makeActivationResult),
      ),
  };
};

const makeActivationResult = (
  arr: readonly OperationResponse[],
): ActivationResult => {
  return arr.every(({ statusCode }) => statusCode === 200) ? 'success' : 'fail';
};

const makeBatchOperations =
  (jobId: ActivationJobId) =>
  (requests: readonly ActivationRequest[]): readonly OperationInput[] =>
    pipe(
      requests,
      RA.map(({ id, _etag }) => ({
        id,
        ifMatch: _etag,
        operationType: BulkOperationType.Patch,
        resourceBody: {
          operations: [
            {
              op: PatchOperationType.replace,
              path: `/activated`,
              value: true,
            },
          ],
        },
      })),
      RA.appendW({
        id: jobId,
        operationType: BulkOperationType.Patch,
        resourceBody: {
          operations: [
            {
              op: PatchOperationType.incr,
              path: `/usersActivated`,
              value: requests.length,
            },
          ],
        },
      }),
    );
