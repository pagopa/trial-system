import { HttpRequest } from '@azure/functions';
import { CreateSubscription } from '../../../../generated/definitions/internal/CreateSubscription';
import { UserId } from '../../../../generated/definitions/internal/UserId';
import { TrialId } from '../../../../generated/definitions/internal/TrialId';
import { CreateSubscriptionStateEnum } from '../../../../generated/definitions/internal/CreateSubscriptionState';

const aUserId = 'aUserId' as UserId;
const aTrialId = 'aTrialId' as TrialId;

export const aCreateSubscription: CreateSubscription = {
  userId: aUserId,
};

export const aCreateSubscriptionWithActiveState: CreateSubscription = {
  ...aCreateSubscription,
  state: CreateSubscriptionStateEnum.ACTIVE,
};

/*
 * This is a function because, if it were an object, the `body` property
 * would be removed during the execution of the tests.
 */
export const makeAValidCreateSubscriptionRequest = (body: CreateSubscription) =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/subscriptions',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    params: {
      trialId: aTrialId,
    },
  });

export const makeAValidGetSubscriptionRequest = () =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/subscriptions/{userId}',
    method: 'GET',
    params: {
      trialId: aTrialId,
      userId: aUserId,
    },
  });
