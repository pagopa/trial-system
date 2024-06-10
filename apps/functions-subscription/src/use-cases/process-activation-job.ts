import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from '../domain/capabilities';
import { ActivationJobItem } from '../domain/activation';

type Env = Pick<Capabilities, 'activationConsumer'>;

export const processActivationJob = (
  job: ActivationJobItem,
  maxFetchSize: number,
) =>
  pipe(
    RTE.ask<Env>(),
    RTE.flatMapTaskEither(({ activationConsumer }) =>
      pipe(
        activationConsumer.fetchActivationRequestItemsToActivate(
          job.trialId,
          maxFetchSize,
        ),
        TE.flatMap((activationRequests) => {
          if (RA.isEmpty(activationRequests)) {
            // Early return if no elements are fetched
            return TE.right(activationRequests);
          } else {
            return pipe(
              activationRequests,
              // Split in chunks
              // Transactional batch can handle only 100 items per batch.
              // Since one item must be the update of the job, we can handle
              // batches of 99 items.
              // https://learn.microsoft.com/en-us/javascript/api/@azure/cosmos/items?view=azure-node-latest#@azure-cosmos-items-batch
              RA.chunksOf(99),
              // Process every chunk
              TE.traverseArray((activationRequests) =>
                activationConsumer.activateRequestItems(
                  job.id,
                  job.trialId,
                  activationRequests,
                ),
              ),
            );
          }
        }),
      ),
    ),
  );
