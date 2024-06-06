import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { SubscriptionRequest } from '../domain/subscription-request';
import { Capabilities } from '../domain/capabilities';
import { Subscription, makeSubscription } from '../domain/subscription';
import { ItemAlreadyExists } from '../domain/errors';
import { makeSubscriptionHistory } from '../domain/subscription-history';

type Env = Pick<
  Capabilities,
  'subscriptionWriter' | 'subscriptionHistoryWriter'
>;

const recoverItemAlreadyExists =
  (subscription: Subscription) => (error: Error) => {
    const { trialId, userId } = subscription;
    if (error instanceof ItemAlreadyExists)
      return TE.right({ trialId, userId });
    else return TE.left(error);
  };

export const processSubscriptionRequest = ({
  trialId,
  userId,
}: SubscriptionRequest) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('subscription', makeSubscription(trialId, userId)),
    RTE.bindW('subscriptionHistory', ({ subscription }) =>
      makeSubscriptionHistory(subscription),
    ),
    RTE.flatMapTaskEither(({ subscription, subscriptionHistory, ...env }) =>
      pipe(
        env.subscriptionWriter.insert(subscription),
        TE.orElse(recoverItemAlreadyExists(subscription)),
        TE.chain(() =>
          env.subscriptionHistoryWriter.insert(subscriptionHistory),
        ),
        TE.map(() => ({ trialId, userId })),
        TE.orElse(recoverItemAlreadyExists(subscription)),
      ),
    ),
  );
