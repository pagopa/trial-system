import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { Capabilities } from '../domain/capabilities';
import { Subscription } from '../domain/subscription';
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

export const processSubscriptionRequest = (subscription: Subscription) =>
  pipe(
    RTE.ask<Env>(),
    RTE.apSW('subscriptionHistory', makeSubscriptionHistory(subscription)),
    RTE.bindW(
      'activationRequest',
      ({ subscriptionHistory: { trialId, userId } }) =>
        makeInsertActivationRequest({
          trialId,
          userId,
          activated: subscription.state !== 'SUBSCRIBED',
        }),
    ),
    RTE.flatMapTaskEither(
      ({ subscriptionHistory, activationRequest, ...env }) =>
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
          TE.map(({ trialId, userId }) => ({ trialId, userId })),
          TE.orElse(recoverItemAlreadyExists(subscription)),
        ),
    ),
  );
