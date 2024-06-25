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
          // insert subscription
          env.subscriptionWriter.insert(subscription),
          TE.orElse(recoverItemAlreadyExists(subscription)),
          // insert subscription-history
          TE.flatMap(() =>
            env.subscriptionHistoryWriter.insert(subscriptionHistory),
          ),
          TE.orElse(recoverItemAlreadyExists(subscription)),
          // insert activation
          TE.flatMap(() =>
            pipe(
              env.activationRequestWriter.insert(activationRequest),
              TE.flatMap((activation) => {
                // this operation is required to keep the number of user activated
                // up to date
                if (activation.activated)
                  return pipe(
                    env.activationRequestWriter.activate([activation]),
                    TE.map(() => activation),
                  );
                else return TE.of(activation);
              }),
            ),
          ),
          TE.orElse(recoverItemAlreadyExists(subscription)),
          TE.map(({ trialId, userId }) => ({ trialId, userId })),
        ),
    ),
  );
