import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from '../domain/capabilities';
import { ActivationJobItem } from '../domain/activation';

type Env = Pick<Capabilities, 'activationConsumer'>;

export const processActivationJob = (
  job: ActivationJobItem,
  maxChunkSize: number,
) =>
  pipe(
    RTE.ask<Env>(),
    RTE.flatMapTaskEither(({ activationConsumer }) =>
      pipe(
        activationConsumer.fetchActivationRequestItemsToActivate(job),
        TE.flatMap((activationRequests) => {
          if (RA.isEmpty(activationRequests)) {
            // Early return if no elements are fetched
            return TE.right([]);
          } else {
            return pipe(
              activationRequests,
              // Split in chunks
              RA.chunksOf(maxChunkSize),
              // Process every chunk
              TE.traverseArray((activationRequests) =>
                activationConsumer.activateRequestItems(
                  job,
                  activationRequests,
                ),
              ),
            );
          }
        }),
      ),
    ),
  );
