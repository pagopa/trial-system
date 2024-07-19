import { parseConfigOrThrow } from './config';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as AR from 'fp-ts/Array';
import { getScenario } from './scenarios/get-scenario';

const config = parseConfigOrThrow(__ENV);

export const options = {
  scenarios: {
    contacts: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      stages: [{ target: config.rate, duration: config.duration }],
      // Max VUs (concurrent users)
      maxVUs: config.maxVUs,
      // How many iterations per timeUnit
      // Start rate iterations per second
      timeUnit: '1s',
      // Pre-allocate VUs (concurrent users)
      preAllocatedVUs: config.preAllocatedVUs,
    },
  },
};

export default async function () {
  await pipe(
    config.SCENARIOS.map(getScenario),
    AR.traverse(TE.ApplicativeSeq)((scenario) =>
      TE.tryCatch(() => scenario(config), E.toError),
    ),
    TE.toUnion,
  )();
}
