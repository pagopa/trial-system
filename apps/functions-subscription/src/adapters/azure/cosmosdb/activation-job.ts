import * as t from 'io-ts';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { pipe } from 'fp-ts/lib/function';
import { InvocationContext } from '@azure/functions';
import { ActivationCodec } from '../../../domain/activation';
import { SystemEnv } from '../../../system-env';

export const makeActivationJobCosmosHandler =
  (env: SystemEnv) =>
  (
    documents: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: InvocationContext,
  ): Promise<unknown> =>
    pipe(
      TE.fromEither(t.array(ActivationCodec).decode(documents)),
      // Keep only job documents
      TE.map(
        RA.filterMap((job) => (job.type === 'job' ? O.some(job) : O.none)),
      ),
      TE.chain(([job, ...tail]) => {
        // Call the method to activate users
        // return env.processActivationJob({usersToActivate: job.usersToActivate, trialId: job.trialId})
        return TE.of([job, ...tail]);
      }),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();
