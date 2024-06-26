import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
// TODO: Move this codec into this file later
import { TrialId, TrialIdCodec } from './subscription';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Capabilities } from './capabilities';
import { ItemAlreadyExists } from './errors';

export const TrialCodec = t.intersection([
  t.strict({
    id: TrialIdCodec,
    name: NonEmptyString,
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

const makeTrialId = (name: Trial['name']) =>
  pipe(
    RTE.ask<Pick<Capabilities, 'hashFn'>>(),
    RTE.map(({ hashFn }) => hashFn(name)),
    RTE.map(({ value }) => value as TrialId),
  );

export const makeTrial = (
  name: Trial['name'],
  description: Trial['description'],
) =>
  pipe(
    makeTrialId(name),
    RTE.map((id) => ({ id, name, description })),
  );
