import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray';
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
  ActivationRequestReader,
  ActivationRequestWriter,
  ActivationResult,
} from '../../../domain/activation-request';
import { decodeFromFeed, decodeFromItem } from './decode';
import { cosmosErrorToDomainError } from './errors';
import { TrialId } from '../../../domain/subscription';

export const makeActivationRequestReaderWriter = (
  db: Database,
): ActivationRequestReader & ActivationRequestWriter => {
  const container = db.container('activations');
  return {
    insert: (insertActivationRequest) =>
      pipe(
        TE.tryCatch(
          () => container.items.create(insertActivationRequest),
          E.toError,
        ),
        TE.flatMapEither(decodeFromItem(ActivationRequestCodec)),
        TE.flatMap(
          TE.fromOption(
            () =>
              new Error('Something went wrong inserting an activation request'),
          ),
        ),
        TE.mapLeft(cosmosErrorToDomainError),
      ),
    list: (trialId, limit) =>
      pipe(
        TE.tryCatch(
          () =>
            container.items
              .query({
                query:
                  'SELECT * FROM c WHERE c.trialId = @trialId AND c.type = "request" AND c.activated = false ORDER BY c.id ASC OFFSET 0 LIMIT @limit',
                parameters: [
                  {
                    name: '@trialId',
                    value: trialId,
                  },
                  {
                    name: '@limit',
                    value: limit,
                  },
                ],
              })
              .fetchAll(),
          E.toError,
        ),
        TE.flatMapEither(decodeFromFeed(ActivationRequestCodec)),
      ),
    activate: (activationRequests) =>
      pipe(
        RNEA.fromReadonlyArray(activationRequests),
        O.map((rnea) =>
          pipe(
            // Transactional batch can handle only 100 items per batch.
            // Since one item must be the update of the job, we can handle
            // batches of 99 items.
            // https://learn.microsoft.com/en-us/javascript/api/@azure/cosmos/items?view=azure-node-latest#@azure-cosmos-items-batch
            RA.chunksOf(99)(rnea),
            RA.map(makeBatchOperations(RNEA.head(rnea).trialId)),
            TE.traverseArray((chunk) =>
              TE.tryCatch(
                () =>
                  container.items.batch([...chunk], RNEA.head(rnea).trialId),
                E.toError,
              ),
            ),
            TE.map(RA.flatMap(({ result }) => result || [])),
          ),
        ),
        O.getOrElseW(() => TE.of([])),
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
  (jobId: TrialId) =>
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
