import { HttpRequest } from '@azure/functions';
import { CreateSubscription } from '../../../../generated/definitions/internal/CreateSubscription';
import { UserId } from '../../../../generated/definitions/internal/UserId';

const aUserId = 'aUserId' as UserId;

const aCreateSubscription: CreateSubscription = {
  userId: aUserId,
};

/*
 * This is a function because, if it were an object, the `body` property
 * would be removed during the execution of the tests.
 */
export const makeAValidCreateSubscriptionRequest = () =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/subscriptions',
    method: 'POST',
    body: { string: JSON.stringify(aCreateSubscription) },
    params: {
      trialId: 'aTrialId',
    },
  });

export const makeAValidGetSubscriptionRequest = () =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/subscriptions/{userId}',
    method: 'GET',
    params: {
      trialId: 'aTrialId',
      userId: aUserId,
    },
  });
