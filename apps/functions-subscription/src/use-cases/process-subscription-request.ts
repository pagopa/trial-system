import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { Subscription } from '../domain/subscription';
import { ItemAlreadyExists } from '../domain/errors';
import {
  insertSubscriptionHistory,
  makeSubscriptionHistory,
} from '../domain/subscription-history';
import {
  insertActivationRequest,
  makeInsertActivationRequest,
} from '../domain/activation-request';

const recoverItemAlreadyExists =
  (subscription: Subscription) => (error: Error) => {
    const { trialId, userId } = subscription;
    if (error instanceof ItemAlreadyExists)
      return RTE.right({ trialId, userId });
    else return RTE.left(error);
  };

export const processSubscriptionRequest = (subscription: Subscription) =>
  pipe(
    makeSubscriptionHistory(subscription),
    RTE.flatMap(insertSubscriptionHistory),
    RTE.orElseW(recoverItemAlreadyExists(subscription)),
    RTE.flatMap(() =>
      pipe(
        makeInsertActivationRequest({
          trialId: subscription.trialId,
          userId: subscription.userId,
          state: subscription.state,
        }),
        RTE.flatMap(insertActivationRequest),
        RTE.orElseW(recoverItemAlreadyExists(subscription)),
      ),
    ),
    RTE.map(() => ({
      trialId: subscription.trialId,
      userId: subscription.userId,
    })),
  );
