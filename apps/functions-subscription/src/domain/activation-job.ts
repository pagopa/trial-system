import * as t from 'io-ts';
import { TrialIdCodec } from './subscription';
import { IsoDateFromString } from '@pagopa/ts-commons/lib/dates';
import { NonNegativeNumber } from '@pagopa/ts-commons/lib/numbers';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

// a unique brand for id of document with type job
interface ActivationJobIdBrand {
  // use `unique symbol` here to ensure uniqueness across modules / packages
  readonly ActivationJobId: unique symbol;
}
export const ActivationJobIdCodec = t.brand(
  NonEmptyString,
  (str): str is t.Branded<NonEmptyString, ActivationJobIdBrand> =>
    str.length > 0,
  'ActivationJobId',
);
export type ActivationJobId = t.TypeOf<typeof ActivationJobIdCodec>;

export const ActivationJobCodec = t.strict({
  id: ActivationJobIdCodec,
  trialId: TrialIdCodec,
  createdAt: IsoDateFromString,
  usersToActivate: NonNegativeNumber,
  usersActivated: NonNegativeNumber,
  type: t.literal('job'),
});

export type ActivationJob = t.TypeOf<typeof ActivationJobCodec>;
