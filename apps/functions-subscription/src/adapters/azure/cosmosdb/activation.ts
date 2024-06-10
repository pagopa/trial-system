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
            id: job.id,
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
            () => container.items.batch([...batchOperations], job.trialId),
            E.toError,
          ),
          TE.map(({ result }) => makeActivationResult(result)),
        );
      } else {
        // NOTE: Maybe this can be a success
        return TE.of('not-executed');
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
