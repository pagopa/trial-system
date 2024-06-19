import * as t from 'io-ts';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { TrialId, TrialIdCodec } from './subscription';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { NonNegativeInteger } from '@pagopa/ts-commons/lib/numbers';
import { ItemAlreadyExists } from './errors';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from './capabilities';
import { nowDate } from './clock';

export const ActivationJobCodec = t.strict({
  trialId: TrialIdCodec,
  createdAt: IsoDateFromString,
  usersToActivate: NonNegativeInteger,
  usersActivated: NonNegativeInteger,
  type: t.literal('job'),
});

export type ActivationJob = t.TypeOf<typeof ActivationJobCodec>;

type InsertActivationJob = Pick<ActivationJob, 'trialId' | 'usersToActivate'>;

export interface ActivationJobWriter {
  readonly insert: (
    ActivationJob: ActivationJob,
  ) => TE.TaskEither<Error | ItemAlreadyExists, ActivationJob>;
}

export interface ActivationJobReader {
  readonly get: (id: TrialId) => TE.TaskEither<Error, O.Option<ActivationJob>>;
}

export const makeActivationJob = ({
  trialId,
  usersToActivate,
}: InsertActivationJob) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'hashFn'>>(),
    RTE.bindW('now', nowDate),
    RTE.map(({ now }) => ({
      trialId,
      type: 'job' as const,
      createdAt: now,
      usersToActivate,
      usersActivated: 0 as NonNegativeInteger,
    })),
  );

export const insertActivationJob = (insertActivationJob: InsertActivationJob) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationJobWriter'>>(),
    RTE.apSW('activationJob', makeActivationJob(insertActivationJob)),
    RTE.flatMapTaskEither(({ activationJob, activationJobWriter }) =>
      activationJobWriter.insert(activationJob),
    ),
  );

export const getActivationJob = (id: TrialId) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'activationJobReader'>>(),
    RTE.flatMapTaskEither(({ activationJobReader }) =>
      activationJobReader.get(id),
    ),
  );
