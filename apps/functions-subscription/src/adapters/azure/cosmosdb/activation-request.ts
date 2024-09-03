import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as A from 'fp-ts/lib/Array';
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
import {
  decodeFromFeed,
  decodeFromItem,
  decodeFromOperationResponse,
} from './decode';
import { cosmosErrorToDomainError } from './errors';
import { TrialId } from '../../../domain/trial';

export const makeActivationRequestReaderWriter = (
  db: Database,
  containerName: string,
): ActivationRequestReader & ActivationRequestWriter => {
  const container = db.container(containerName);
  return {
    insert: (insertActivationRequest) =>
      pipe(
        insertActivationRequest.state === 'ACTIVE'
          ? pipe(
              TE.tryCatch(
                () =>
                  container.items.batch(
                    [
                      {
                        operationType: BulkOperationType.Create,
                        resourceBody: insertActivationRequest,
                      },
                      {
                        id: insertActivationRequest.trialId,
                        operationType: BulkOperationType.Patch,
                        resourceBody: {
                          operations: [
                            {
                              op: PatchOperationType.incr,
                              path: `/usersActivated`,
                              value: 1,
                            },
                          ],
                        },
                      },
                    ],
                    insertActivationRequest.trialId,
                  ),
                E.toError,
              ),
              TE.flatMapEither(({ result }) =>
                pipe(
                  result || [],
                  A.head,
                  O.map(decodeFromOperationResponse(ActivationRequestCodec)),
                  O.getOrElseW(() => E.right(O.none)),
                ),
              ),
            )
          : pipe(
              TE.tryCatch(
                () => container.items.create(insertActivationRequest),
                E.toError,
              ),
              TE.flatMapEither(decodeFromItem(ActivationRequestCodec)),
            ),
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
                  'SELECT * FROM c WHERE c.trialId = @trialId AND c.type = "request" AND c.state = "SUBSCRIBED" ORDER BY c.id ASC OFFSET 0 LIMIT @limit',
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
    get: (trialId, userId) =>
      pipe(
        TE.tryCatch(
          () =>
            container.items
              .query({
                query:
                  'SELECT * FROM c WHERE c.trialId = @trialId AND c.type = "request" AND c.userId = @userId OFFSET 0 LIMIT 1',
                parameters: [
                  {
                    name: '@trialId',
                    value: trialId,
                  },
                  {
                    name: '@userId',
                    value: userId,
                  },
                ],
              })
              .fetchAll(),
          E.toError,
        ),
        TE.flatMapEither(decodeFromFeed(ActivationRequestCodec)),
        TE.mapBoth(cosmosErrorToDomainError, RA.head),
      ),
    updateActivationRequestsState: (activationRequests, state) =>
      pipe(
        RNEA.fromReadonlyArray(activationRequests),
        O.map((rnea) =>
          pipe(
            // Transactional batch can handle only 100 items per batch.
            // Since one item must be the update of the job, we can handle
            // batches of 99 items.
            // https://learn.microsoft.com/en-us/javascript/api/@azure/cosmos/items?view=azure-node-latest#@azure-cosmos-items-batch
            RA.chunksOf(99)(rnea),
            RA.map(makeBatchOperations(RNEA.head(rnea).trialId, state)),
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
  (jobId: TrialId, state: ActivationRequest['state']) =>
  (requests: readonly ActivationRequest[]): readonly OperationInput[] => {
    // If state is active, increment counter by the number of requests (filter out the activation requests that are already ACTIVE);
    // otherwise, decrement the counter only by the number of "ACTIVE" activation requests
    const activeRequests = requests.filter(({ state }) => state === 'ACTIVE');
    const nonActiveRequests = requests.filter(
      ({ state }) => state !== 'ACTIVE',
    );
    const usersActivatedIncrement =
      state === 'ACTIVE'
        ? Math.abs(nonActiveRequests.length)
        : -Math.abs(activeRequests.length);

    return pipe(
      requests,
      RA.map(({ id, _etag }) => ({
        id,
        ifMatch: _etag,
        operationType: BulkOperationType.Patch,
        resourceBody: {
          operations: [
            {
              op: PatchOperationType.replace,
              path: `/state`,
              value: state,
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
              value: usersActivatedIncrement,
            },
          ],
        },
      }),
    );
  };
