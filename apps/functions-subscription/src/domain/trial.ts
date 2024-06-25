import * as t from 'io-ts';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';

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

// TODO: Complete this codec adding new properties
export const TrialCodec = t.strict({
  trialId: TrialIdCodec,
});
export type Trial = t.TypeOf<typeof TrialCodec>;
