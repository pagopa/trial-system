import { CreateSubscription } from '../../../../generated/definitions/internal/CreateSubscription';
import { UserId } from '../../../../generated/definitions/internal/UserId';
import { HttpRequest } from '@azure/functions';

const aUserId = 'aUserId' as UserId;

const aCreateSubscription: CreateSubscription = {
  userId: aUserId,
};

export const makeAValidCreateSubscriptionRequest = () =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/subscriptions',
    method: 'POST',
    body: { string: JSON.stringify(aCreateSubscription) },
    params: {
      trialId: 'aTrialId',
    },
  });
