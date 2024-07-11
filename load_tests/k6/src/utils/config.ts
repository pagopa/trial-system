import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { readableReportSimplified } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { CommaSeparatedListOf } from "./separated-list";
import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { BooleanFromString } from "io-ts-types";

export const FeatureScenarioType = t.union([
  t.literal("TRIAL_MANAGER_ACTIVATION"),
  t.literal("TRIAL_MANAGER_GET_SUB")
]);
export type FeatureScenarioType = t.TypeOf<typeof FeatureScenarioType>;

export const K6Config = t.type({
  rate: IntegerFromString,
  duration: NonEmptyString,
  preAllocatedVUs: IntegerFromString,
  maxVUs: IntegerFromString,
});
export type K6Config = t.TypeOf<typeof K6Config>;

export const IConfig = t.intersection([
  t.type({
    TRIAL_BASE_URL: NonEmptyString,
    TRIAL_SUBSCRIPTION_KEY: NonEmptyString,
    TRIAL_ID: NonEmptyString,
    SCENARIOS: CommaSeparatedListOf(FeatureScenarioType)
  }),
  K6Config
]);
export type IConfig = t.TypeOf<typeof IConfig>;

export const getConfigOrThrow = (
  environment: { [name: string]: string } | NodeJS.ProcessEnv
) =>
  pipe(
    environment,
    (env) => ({
      ...env,
      FEATURE_ENABLED: pipe(
        env.FEATURE_ENABLED,
        BooleanFromString.decode,
        E.getOrElse(() => false)
      )
    }),
    IConfig.decode,
    E.getOrElseW((errs) => {
      throw new Error(readableReportSimplified(errs));
    })
  );
