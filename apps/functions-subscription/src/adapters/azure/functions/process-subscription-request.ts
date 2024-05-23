import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { InvocationContext } from '@azure/functions';
import { SystemEnv } from '../../../system-env';
import {
  SubscriptionRequest,
  SubscriptionRequestCodec,
} from '../../../domain/subscription-request';

export const makeSubscriptionRequestConsumerHandler =
  (env: Pick<SystemEnv, 'processSubscriptionRequest'>) =>
  (
    messages: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: InvocationContext,
  ): Promise<readonly SubscriptionRequest[]> =>
    pipe(
      TE.fromEither(t.array(SubscriptionRequestCodec).decode(messages)),
      TE.chainW(TE.traverseArray(env.processSubscriptionRequest)),
      TE.getOrElse((error) => {
        // eslint-disable-next-line functional/no-promise-reject
        return () => Promise.reject(error);
      }),
      // run the task returning a promise
      (task) => task(),
    );
