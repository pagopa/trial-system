import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from './capabilities';
import { ItemAlreadyExists } from './errors';
import { User } from './users';

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

const BaseTrialCodec = t.intersection([
  t.strict({ id: TrialIdCodec, name: NonEmptyString }),
  t.partial({ description: t.string, ownerId: t.string }), //ownerId should be mandatory after the migration
]);

const CreatingTrialCodec = t.intersection([
  BaseTrialCodec,
  t.strict({
    state: t.literal('CREATING'),
  }),
]);

const CreatedTrialCodec = t.intersection([
  BaseTrialCodec,
  t.strict({
    state: t.literal('CREATED'),
    identityId: NonEmptyString,
  }),
]);

export const TrialCodec = t.union([CreatingTrialCodec, CreatedTrialCodec]);
export type Trial = t.TypeOf<typeof TrialCodec>;

export interface TrialWriter {
  readonly insert: (
    trial: Trial,
  ) => TE.TaskEither<Error | ItemAlreadyExists, Trial>;
  readonly upsert: (trial: Trial) => TE.TaskEither<Error, Trial>;
}

export interface TrialReader {
  readonly get: (trialId: TrialId) => TE.TaskEither<Error, O.Option<Trial>>;
  readonly list: () => TE.TaskEither<Error, readonly Trial[]>;
}

const makeTrialId = () =>
  pipe(
    RTE.ask<Pick<Capabilities, 'monotonicIdFn'>>(),
    RTE.map(({ monotonicIdFn }) => monotonicIdFn()),
    RTE.map(({ value }) => value as TrialId),
  );

const makeTrial = (
  name: Trial['name'],
  description: Trial['description'],
  ownerId: User['id'],
) =>
  pipe(
    makeTrialId(),
    RTE.map((id) => ({
      id,
      name,
      description,
      state: 'CREATING' as const,
      ownerId,
    })),
  );

export const insertTrial = (
  name: Trial['name'],
  description: Trial['description'],
  { id: ownerId }: User,
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialWriter'>>(),
    RTE.apSW('trial', makeTrial(name, description, ownerId)),
    RTE.flatMapTaskEither(({ trial, trialWriter }) =>
      trialWriter.insert(trial),
    ),
  );

export const getTrialById = (trialId: TrialId) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialReader'>>(),
    RTE.flatMapTaskEither(({ trialReader }) => trialReader.get(trialId)),
  );

export const listTrials = () =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialReader'>>(),
    RTE.flatMapTaskEither(({ trialReader }) => trialReader.list()),
  );
