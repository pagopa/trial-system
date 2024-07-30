import { pipe } from 'fp-ts/lib/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Subscription, UserId } from '../domain/subscription';
import { TrialId } from '../domain/trial';
import {
  activateActivationRequests,
  ActivationRequest,
  updateState,
  getActivationRequest,
} from '../domain/activation-request';
import { ItemNotFound } from '../domain/errors';

const handleUpdateSubscriptionState = (
  activationRequest: ActivationRequest,
  newState: Subscription['state'],
) => {
  if (newState === 'ACTIVE')
    return activateActivationRequests([activationRequest]);
  else return updateState([activationRequest], newState);
};

export const updateSubscription = (
  userId: UserId,
  trialId: TrialId,
  state: Subscription['state'],
) =>
  pipe(
    getActivationRequest(trialId, userId),
    RTE.flatMapOption(
      (req) => req,
      () => new ItemNotFound('Subscription not found'),
    ),
    RTE.flatMap((req) => {
      if (state !== req.state) {
        return pipe(
          handleUpdateSubscriptionState(req, state),
          RTE.flatMap(() => RTE.of({ ...req, state })),
        );
      } else {
        return RTE.of(req);
      }
    }),
  );
