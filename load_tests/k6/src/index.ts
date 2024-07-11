import { getConfigOrThrow } from "./utils/config";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as AR from "fp-ts/Array";
import { getFeatureScenario } from "./scenarios/mapping";

const config = getConfigOrThrow(__ENV);

export const options = {
  scenarios: {
    contacts: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      // stages: [{target: 50, duration: "1m"}, {target: 100, duration: "1m"}, {target: config.rate, duration: "1m"}, {target: 400, duration: "3m"}],
      stages: [
        { target: config.rate, duration: "1m" },
        { target: config.rate * 2, duration: "1m" }
      ],
      // How long the test lasts
      // duration: config.duration,
      maxVUs: config.maxVUs,
      // How many iterations per timeUnit
      // Start rate iterations per second
      timeUnit: "1s",
      // Pre-allocate VUs (concurrent users)
      preAllocatedVUs: config.preAllocatedVUs
    }
  }
};

export default async function() {
  await pipe(
    config.SCENARIOS.map(getFeatureScenario),
    scenarios => scenarios.map(fn => TE.tryCatch(() => fn(config), E.toError)),
    AR.sequence(TE.ApplicativeSeq),
    TE.toUnion
  )();
}
