import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { SubscriptionRequest } from '../domain/subscription-request';
import { Capabilities } from '../domain/capabilities';
import { Subscription, makeSubscription } from '../domain/subscription';
import { ItemAlreadyExists } from '../domain/errors';
import { makeSubscriptionHistory } from '../domain/subscription-history';
import { makeInsertActivationRequest } from '../domain/activation-request';

type Env = Pick<
  Capabilities,
  'subscriptionWriter' | 'subscriptionHistoryWriter' | 'activationRequestWriter'
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
    RTE.apSW(
      'activationRequest',
      makeInsertActivationRequest({ trialId, userId }),
    ),
    RTE.flatMapTaskEither(
      ({ subscription, subscriptionHistory, activationRequest, ...env }) =>
        pipe(
          env.subscriptionWriter.insert(subscription),
          TE.orElse(recoverItemAlreadyExists(subscription)),
          TE.flatMap(() =>
            env.subscriptionHistoryWriter.insert(subscriptionHistory),
          ),
          TE.orElse(recoverItemAlreadyExists(subscription)),
          TE.flatMap(() =>
            env.activationRequestWriter.insert(activationRequest),
          ),
          TE.map(() => ({ trialId, userId })),
          TE.orElse(recoverItemAlreadyExists(subscription)),
        ),
    ),
  );
