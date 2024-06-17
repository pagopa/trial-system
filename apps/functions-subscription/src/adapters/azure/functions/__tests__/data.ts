import { HttpRequest } from '@azure/functions';
import { CreateSubscription } from '../../../../generated/definitions/internal/CreateSubscription';
import { UserId } from '../../../../generated/definitions/internal/UserId';
import { TrialId } from '../../../../generated/definitions/internal/TrialId';
import { anActivationJob } from '../../../../domain/__tests__/data';

const aUserId = 'aUserId' as UserId;
const aTrialId = 'aTrialId' as TrialId;

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

export const makeAValidCreateActivationJobRequest = () =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/activation-jobs',
    method: 'POST',
    body: {
      string: JSON.stringify({
        usersToActivate: anActivationJob.usersToActivate,
      }),
    },
    params: {
      trialId: aTrialId,
    },
  });
