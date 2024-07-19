import { pipe } from 'fp-ts/lib/function';
import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import { readableReportSimplified } from '@pagopa/ts-commons/lib/reporters';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { CommaSeparatedListOf } from './codec/separated-list';
import { IntegerFromString } from '@pagopa/ts-commons/lib/numbers';

export const FeatureScenarioType = t.union([
  t.literal('TRIAL_MANAGER_ACTIVATION'),
  t.literal('TRIAL_MANAGER_GET_SUB'),
]);
export type FeatureScenarioType = t.TypeOf<typeof FeatureScenarioType>;

const EnvsCodec = t.strict({
  TRIAL_BASE_URL: NonEmptyString,
  TRIAL_SUBSCRIPTION_KEY: NonEmptyString,
  TRIAL_ID: NonEmptyString,
  SCENARIOS: CommaSeparatedListOf(FeatureScenarioType),
  // k6 configuration
  rate: IntegerFromString,
  duration: NonEmptyString,
  preAllocatedVUs: IntegerFromString,
  maxVUs: IntegerFromString,
});
export type Config = t.TypeOf<typeof EnvsCodec>;

export const parseConfigOrThrow = (
  envs: Record<string, undefined | string>,
): Config =>
  pipe(
    EnvsCodec.decode(envs),
    E.getOrElseW((errs) => {
      // eslint-disable-next-line functional/no-throw-statements
      throw new Error(readableReportSimplified(errs));
    }),
  );
