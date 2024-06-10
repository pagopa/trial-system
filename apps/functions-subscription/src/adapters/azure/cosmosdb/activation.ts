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
  ActivationRequestItemCodec,
  ActivationResult,
  ActivationConsumer,
} from '../../../domain/activation';
import { decodeFromFeed } from './decode';

export const makeActivationCosmosContainer = (
  db: Database,
): ActivationConsumer => {
  const container = db.container('activations');
  return {
    fetchActivationRequestItemsToActivate: (trialId, elementsToFetch) =>
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
        TE.flatMapEither(decodeFromFeed(ActivationRequestItemCodec)),
      ),
    activateRequestItems: (jobId, trialId, activationRequests) => {
      if (activationRequests.length > 0) {
        const batchOperations: readonly OperationInput[] = pipe(
          activationRequests,
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
                  value: activationRequests.length,
                },
              ],
            },
          }),
        );
        return pipe(
          TE.tryCatch(
            () => container.items.batch([...batchOperations], trialId),
            E.toError,
          ),
          TE.map(({ result }) => makeActivationResult(result)),
        );
      } else {
        return TE.of('success');
      }
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
