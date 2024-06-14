import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from '../domain/capabilities';
import { ActivationJob } from '../domain/activation-job';

type Env = Pick<Capabilities, 'activationRequestRepository'>;

export const processActivationJob = (
  job: ActivationJob,
  maxFetchSize: number,
) =>
  pipe(
    RTE.ask<Env>(),
    RTE.flatMapTaskEither(({ activationRequestRepository }) =>
      pipe(
        activationRequestRepository.list(job.trialId, maxFetchSize),
        TE.flatMap((activationRequests) =>
          activationRequestRepository.activate(job, activationRequests),
        ),
      ),
    ),
  );
