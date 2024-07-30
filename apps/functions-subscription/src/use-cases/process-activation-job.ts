import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from '../domain/capabilities';
import { ActivationJob } from '../domain/activation-job';

type Env = Pick<
  Capabilities,
  'activationRequestReader' | 'activationRequestWriter'
>;

export const processActivationJob = (
  job: ActivationJob,
  maxFetchSize: number,
) =>
  pipe(
    RTE.ask<Env>(),
    RTE.let('limit', () =>
      Math.min(maxFetchSize, job.usersToActivate - job.usersActivated),
    ),
    RTE.flatMapTaskEither(
      ({ activationRequestReader, activationRequestWriter, limit }) =>
        limit <= 0
          ? TE.of('success')
          : pipe(
              activationRequestReader.list(job.trialId, limit),
              TE.flatMap((activationRequests) =>
                activationRequestWriter.activate(activationRequests),
              ),
            ),
    ),
  );
