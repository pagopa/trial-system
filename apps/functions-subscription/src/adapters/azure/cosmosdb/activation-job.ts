import * as t from 'io-ts';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { flow, pipe } from 'fp-ts/lib/function';
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
      // documents is an array of documents of the activations container
      // decode the documents with the ActivationCodec
      TE.fromEither(t.array(ActivationCodec).decode(documents)),
      // Keep only job documents
      TE.map(
        flow(
          RA.filterMap((doc) => (doc.type === 'job' ? O.some(doc) : O.none)),
        ),
      ),
      TE.flatMap(([job]) =>
        // Call the method to activate users
        env.processActivationJob(job),
      ),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();
