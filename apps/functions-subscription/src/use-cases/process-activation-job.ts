import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from '../domain/capabilities';
import { ActivationJob } from '../domain/activation';

type Env = Pick<Capabilities, 'activationService'>;

export const processActivationJob = (job: ActivationJob) =>
  pipe(
    RTE.ask<Env>(),
    RTE.flatMapTaskEither(({ activationService }) =>
      pipe(
        activationService.fetchActivationRequestsToActivate(job),
        // Create chunk of users
        // FIXME: Remove magic number here
        TE.map(RA.chunksOf(99)),
        // Activate chunk of users
        TE.flatMap(
          TE.traverseArray(activationService.activateActivationRequests(job)),
        ),
      ),
    ),
  );
