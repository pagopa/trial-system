import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from './capabilities';
import { ItemAlreadyExists } from './errors';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { nowDate } from './clock';

// a unique brand for trialId
interface TrialIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly TrialId: unique symbol;
}
export const TrialIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, TrialIdBrand> => str.length > 0,
  'TrialId',
);
export type TrialId = t.TypeOf<typeof TrialIdCodec>;

export const TrialCodec = t.intersection([
  t.strict({
    id: TrialIdCodec,
    name: NonEmptyString,
    state: t.keyof({
      CREATING: null,
      CREATED: null,
    }),
    createdAt: IsoDateFromString,
    updatedAt: IsoDateFromString,
  }),
  t.partial({
    description: t.string,
  }),
]);
export type Trial = t.TypeOf<typeof TrialCodec>;

export interface TrialWriter {
  readonly insert: (
    trial: Trial,
  ) => TE.TaskEither<Error | ItemAlreadyExists, Trial>;
}

export interface TrialReader {
  readonly get: (trialId: TrialId) => TE.TaskEither<Error, O.Option<Trial>>;
}

const makeTrialId = () =>
  pipe(
    RTE.ask<Pick<Capabilities, 'monotonicIdFn'>>(),
    RTE.map(({ monotonicIdFn }) => monotonicIdFn()),
    RTE.map(({ value }) => value as TrialId),
  );

const makeTrial = (name: Trial['name'], description: Trial['description']) =>
  pipe(
    RTE.Do,
    RTE.apSW('id', makeTrialId()),
    RTE.apSW('now', nowDate()),
    RTE.map(({ id, now }) => {
      const createdAt = now;
      const updatedAt = now;
      return {
        id,
        name,
        description,
        createdAt,
        updatedAt,
        state: 'CREATING' as const,
      };
    }),
  );

export const insertTrial = (
  name: Trial['name'],
  description: Trial['description'],
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialWriter'>>(),
    RTE.apSW('trial', makeTrial(name, description)),
    RTE.flatMapTaskEither(({ trial, trialWriter }) =>
      trialWriter.insert(trial),
    ),
  );

export const getTrialById = (trialId: TrialId) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialReader'>>(),
    RTE.flatMapTaskEither(({ trialReader }) => trialReader.get(trialId)),
  );
