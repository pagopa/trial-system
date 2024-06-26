import * as RTE from 'fp-ts/ReaderTaskEither';
import { makeTrial, Trial } from '../domain/trial';
import { pipe } from 'fp-ts/lib/function';
import { Capabilities } from '../domain/capabilities';

export const createTrial = (
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
