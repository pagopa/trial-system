import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { InvocationContext } from '@azure/functions';
import { SystemEnv } from '../../../system-env';
import { Subscription, SubscriptionCodec } from '../../../domain/subscription';

export const makeSubscriptionRequestConsumerHandler =
  (env: Pick<SystemEnv, 'processSubscriptionRequest'>) =>
  (
    messages: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: InvocationContext,
  ): Promise<readonly Pick<Subscription, 'trialId' | 'userId'>[]> =>
    pipe(
      TE.fromEither(t.array(SubscriptionCodec).decode(messages)),
      TE.chainW(TE.traverseArray(env.processSubscriptionRequest)),
      TE.getOrElse((error) => {
        // if an error occurs, the retry policy will be applied if it is defined
        // eslint-disable-next-line functional/no-throw-statements
        throw error;
      }),
    )();
