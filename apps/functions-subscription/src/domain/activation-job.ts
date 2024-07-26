import * as t from 'io-ts';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { NonNegativeInteger } from '@pagopa/ts-commons/lib/numbers';
import { ItemAlreadyExists, ItemNotFound } from './errors';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from './capabilities';
import { TrialId, TrialIdCodec } from './trial';

export const ActivationJobCodec = t.strict({
  trialId: TrialIdCodec,
  usersToActivate: NonNegativeInteger,
  usersActivated: NonNegativeInteger,
  type: t.literal('job'),
});

export type ActivationJob = t.TypeOf<typeof ActivationJobCodec>;

type InsertActivationJob = Pick<ActivationJob, 'trialId' | 'usersToActivate'>;
type UpdateActivationJob = Pick<ActivationJob, 'usersToActivate'>;

export interface ActivationJobWriter {
  readonly insert: (
    activationJob: ActivationJob,
  ) => TE.TaskEither<Error | ItemAlreadyExists, ActivationJob>;

  readonly update: (
    trialId: ActivationJob['trialId'],
    update: UpdateActivationJob,
  ) => TE.TaskEither<Error | ItemNotFound, ActivationJob>;
}

export interface ActivationJobReader {
  readonly get: (id: TrialId) => TE.TaskEither<Error, O.Option<ActivationJob>>;
}

export const makeActivationJob = ({
  trialId,
  usersToActivate,
}: InsertActivationJob) => ({
  trialId,
  type: 'job' as const,
  usersToActivate,
  usersActivated: 0 as NonNegativeInteger,
});

export const getActivationJob = (id: TrialId) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationJobReader'>>(),
    RTE.flatMapTaskEither(({ activationJobReader }) =>
      activationJobReader.get(id),
    ),
  );

export const updateActivationJob = (
  trialId: ActivationJob['trialId'],
  update: UpdateActivationJob,
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationJobWriter'>>(),
    RTE.flatMapTaskEither(({ activationJobWriter }) =>
      activationJobWriter.update(trialId, update),
    ),
  );
