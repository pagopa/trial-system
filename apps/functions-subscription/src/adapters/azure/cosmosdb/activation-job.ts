import * as t from 'io-ts';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { flow, pipe } from 'fp-ts/lib/function';
import { InvocationContext } from '@azure/functions';
import {
  ActivationJobItemCodec,
  ActivationRequestItemCodec,
} from '../../../domain/activation';
import { SystemEnv } from '../../../system-env';
import { Config } from '../../../config';

export const makeActivationJobCosmosHandler =
  (env: SystemEnv, { activations }: Config) =>
  (
    documents: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: InvocationContext,
  ): Promise<unknown> =>
    pipe(
      // documents is an array of documents of the activations container
      TE.fromEither(
        t
          .array(t.union([ActivationRequestItemCodec, ActivationJobItemCodec]))
          .decode(documents),
      ),
      // Keep only job documents
      TE.map(
        flow(
          RA.filterMap((doc) => (doc.type === 'job' ? O.some(doc) : O.none)),
        ),
      ),
      TE.flatMap(([job]) =>
        // Call the method to activate users
        env.processActivationJob(job, activations.concurrencyThreshold),
      ),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();
