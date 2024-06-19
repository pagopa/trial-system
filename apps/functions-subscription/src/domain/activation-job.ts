import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { TrialIdCodec } from './subscription';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { NonNegativeNumber } from '@pagopa/ts-commons/lib/numbers';
import { ItemAlreadyExists } from './errors';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from './capabilities';
import { nowDate } from './clock';

export const ActivationJobCodec = t.strict({
  trialId: TrialIdCodec,
  createdAt: IsoDateFromString,
  usersToActivate: NonNegativeNumber,
  usersActivated: NonNegativeNumber,
  type: t.literal('job'),
});

export type ActivationJob = t.TypeOf<typeof ActivationJobCodec>;

type InsertActivationJob = Pick<ActivationJob, 'trialId' | 'usersToActivate'>;

export interface ActivationJobWriter {
  readonly insert: (
    ActivationJob: ActivationJob,
  ) => TE.TaskEither<Error | ItemAlreadyExists, ActivationJob>;
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
      usersActivated: 0 as NonNegativeNumber,
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
