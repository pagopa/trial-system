import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from './capabilities';
import { ItemAlreadyExists, ItemNotFound } from './errors';
import { Tenant, TenantIdCodec } from './users';
import { flow } from 'fp-ts/lib/function';

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

const ListTrialOptionsCodec = t.strict({
  pageSize: t.number,
  maximumId: t.union([TrialIdCodec, t.undefined]),
  minimumId: t.union([TrialIdCodec, t.undefined]),
});
export type ListTrialOptions = t.TypeOf<typeof ListTrialOptionsCodec>;

const BaseTrialCodec = t.intersection([
  t.strict({ id: TrialIdCodec, name: NonEmptyString, ownerId: TenantIdCodec }),
  t.partial({ description: t.string }), //ownerId should be mandatory after the migration
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
  readonly list: (
    options: ListTrialOptions,
  ) => TE.TaskEither<Error, readonly Trial[]>;
  readonly getByIdAndOwnerId: (
    trialId: TrialId,
    ownerId: Trial['ownerId'],
  ) => TE.TaskEither<Error, O.Option<Trial>>;
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
  ownerId: Tenant['id'],
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
  { id: ownerId }: Tenant,
) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialWriter'>>(),
    RTE.apSW('trial', makeTrial(name, description, ownerId)),
    RTE.flatMapTaskEither(({ trial, trialWriter }) =>
      trialWriter.insert(trial),
    ),
  );

export const getTrialById = (trialId: TrialId, tenant: Tenant) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialReader'>>(),
    RTE.flatMapTaskEither(({ trialReader }) =>
      tenant.type === 'owner'
        ? trialReader.getByIdAndOwnerId(trialId, tenant.id)
        : trialReader.get(trialId),
    ),
  );

export const listTrials = (options: ListTrialOptions) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialReader'>>(),
    RTE.flatMapTaskEither(({ trialReader }) => trialReader.list(options)),
  );

/**
 * Return a trialId, on the right side.
 * If the tenant is a `owner`, then we need to get the trial first; if the trial does not
 * exist, then return a {@link ItemNotFound} error on the left side.
 * If the tenant is not an owner, then we do not need to check if the trial exists.
 */
export const getTrialIdByTenant = (trialId: TrialId, tenant: Tenant) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'trialReader'>>(),
    RTE.flatMapTaskEither(({ trialReader }) =>
      tenant.type === 'owner'
        ? pipe(
            trialReader.getByIdAndOwnerId(trialId, tenant.id),
            TE.flatMapOption(
              flow(O.map(({ id }) => id)),
              () => new ItemNotFound('Item not found'),
            ),
          )
        : TE.of(trialId),
    ),
  );
