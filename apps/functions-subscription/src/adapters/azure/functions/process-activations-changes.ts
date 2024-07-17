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
              TE.mapBoth(
                (error) => {
                  // TODO: Remove this log
                  // eslint-disable-next-line functional/no-expression-statements
                  context.error(
                    `Error on processActivationRequest processing document: ${JSON.stringify(document, null, 2)}`,
                  );
                  return error;
                },
                () => 'success' as const,
              ),
            );
        }),
      ),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();
