import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from '../domain/capabilities';
import { ActivationJob } from '../domain/activation';
import { Config } from '../config';

type Env = Pick<Capabilities, 'activationService'>;

export const processActivationJob =
  ({ activations }: Config) =>
  (job: ActivationJob) =>
    pipe(
      RTE.ask<Env>(),
      RTE.flatMapTaskEither(({ activationService }) =>
        pipe(
          activationService.fetchActivationRequestsToActivate(job),
          // Create chunk of users
          TE.map(RA.chunksOf(activations.concurrencyThreshold)),
          // Activate chunk of users
          TE.flatMap(
            TE.traverseArray(activationService.activateActivationRequests(job)),
          ),
        ),
      ),
    );
