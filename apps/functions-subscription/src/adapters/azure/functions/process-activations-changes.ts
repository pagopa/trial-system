import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { InvocationContext } from '@azure/functions';
import { ActivationRequestCodec } from '../../../domain/activation-request';
import { ActivationJobCodec } from '../../../domain/activation-job';
import { SystemEnv } from '../../../system-env';
import { Config } from '../../../config';

export const makeActivationsChangesHandler =
  ({
    env,
    config,
  }: {
    readonly env: Pick<
      SystemEnv,
      'processActivationJob' | 'processActivationRequest'
    >;
    readonly config: Pick<Config, 'activations'>;
  }) =>
  (
    documents: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: InvocationContext,
  ): Promise<unknown> =>
    pipe(
      // documents is an array of documents of the activations container
      TE.fromEither(
        t
          .array(t.union([ActivationRequestCodec, ActivationJobCodec]))
          .decode(documents),
      ),
      TE.flatMap(
        TE.traverseArray((document) => {
          if (document.type === 'job')
            return env.processActivationJob(
              document,
              config.activations.maxFetchSize,
            );
          else
            return pipe(
              env.processActivationRequest(document),
              TE.map(() => 'success' as const),
            );
        }),
      ),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();
