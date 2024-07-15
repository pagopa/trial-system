import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RA from 'fp-ts/lib/ReadonlyArray';
import { flow, pipe } from 'fp-ts/lib/function';
import { InvocationContext } from '@azure/functions';
import {
  ActivationRequest,
  ActivationRequestCodec,
} from '../../../domain/activation-request';
import {
  ActivationJob,
  ActivationJobCodec,
} from '../../../domain/activation-job';
import { SystemEnv } from '../../../system-env';
import { Config } from '../../../config';

const processDocument =
  (
    env: Pick<SystemEnv, 'processActivationJob' | 'processActivationRequest'>,
    config: Pick<Config, 'activations'>,
  ) =>
  (document: ActivationRequest | ActivationJob) => {
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
  };

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (documents: unknown, context: InvocationContext): Promise<unknown> =>
    pipe(
      // documents is an array of documents of the activations container
      TE.fromEither(
        t
          .array(t.union([ActivationRequestCodec, ActivationJobCodec]))
          .decode(documents),
      ),
      TE.flatMap(
        flow(
          RA.map(processDocument(env, config)),
          RA.sequence(TE.ApplicativePar),
        ),
      ),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();
