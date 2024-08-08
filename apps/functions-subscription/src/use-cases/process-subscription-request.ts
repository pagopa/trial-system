import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { Subscription } from '../domain/subscription';
import { ItemAlreadyExists } from '../domain/errors';
import {
  insertSubscriptionHistory,
  makeSubscriptionHistory,
} from '../domain/subscription-history';
import {
  ActivationRequest,
  insertActivationRequest,
  makeInsertActivationRequest,
  updateActivationRequestState,
} from '../domain/activation-request';

const recoverItemAlreadyExists =
  (subscription: Subscription) => (error: Error) => {
    const { trialId, userId } = subscription;
    if (error instanceof ItemAlreadyExists)
      return RTE.right({ trialId, userId });
    else return RTE.left(error);
  };

const handleActivatedRequest = (request: ActivationRequest) =>
  request.state === 'ACTIVE'
    ? pipe(
        // This operation is required to keep the number of activated users up to date.
        // The assumption is that the activation job exists.
        updateActivationRequestState([request], 'ACTIVE'),
        RTE.map(() => request),
      )
    : RTE.of(request);

export const processSubscriptionRequest = (subscription: Subscription) =>
  pipe(
    makeSubscriptionHistory(subscription),
    RTE.flatMap(insertSubscriptionHistory),
    RTE.orElseW(recoverItemAlreadyExists(subscription)),
    RTE.flatMap(() =>
      subscription.state === 'SUBSCRIBED' || subscription.state === 'ACTIVE'
        ? pipe(
            makeInsertActivationRequest({
              trialId: subscription.trialId,
              userId: subscription.userId,
              state: subscription.state,
            }),
            RTE.flatMap(insertActivationRequest),
            RTE.flatMap(handleActivatedRequest),
            RTE.orElseW(recoverItemAlreadyExists(subscription)),
          )
        : RTE.of(subscription),
    ),
    RTE.map(() => ({
      trialId: subscription.trialId,
      userId: subscription.userId,
    })),
  );
