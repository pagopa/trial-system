import { HttpRequest } from '@azure/functions';
import { CreateSubscription } from '../../../../generated/definitions/internal/CreateSubscription';
import { UserId } from '../../../../generated/definitions/internal/UserId';
import { TrialId } from '../../../../generated/definitions/internal/TrialId';
import { CreateSubscriptionStateEnum } from '../../../../generated/definitions/internal/CreateSubscriptionState';
import { anActivationJob, aTrial } from '../../../../domain/__tests__/data';
import { UpdateSubscription } from '../../../../generated/definitions/internal/UpdateSubscription';

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

export const makeAValidUpdateSubscriptionRequest = (body: UpdateSubscription) =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/subscriptions/{userId}',
    method: 'PUT',
    headers: { 'x-user-groups': 'ApiTrialManager' },
    body: { string: JSON.stringify(body) },
    params: {
      trialId: aTrialId,
      userId: aUserId,
    },
  });

export const makeAValidGetActivationJobRequest = () =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/activation-job',
    method: 'GET',
    headers: { 'x-user-groups': 'ApiTrialManager' },
    params: {
      trialId: aTrialId,
    },
  });

export const makeAValidUpdateActivationJobRequest = () =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}/activation-job',
    method: 'PUT',
    headers: { 'x-user-groups': 'ApiTrialManager' },
    body: {
      string: JSON.stringify({
        usersToActivate: anActivationJob.usersToActivate,
      }),
    },
    params: {
      trialId: anActivationJob.trialId,
    },
  });

export const makeAValidCreateTrialRequest = () =>
  new HttpRequest({
    url: 'https://function/trials',
    method: 'POST',
    headers: { 'x-user-groups': 'ApiTrialManager' },
    body: {
      string: JSON.stringify({
        name: aTrial.name,
        description: aTrial.description,
      }),
    },
  });

export const makeAValidGetTrialRequest = () =>
  new HttpRequest({
    url: 'https://function/trials/{trialId}',
    method: 'GET',
    headers: { 'x-user-groups': 'ApiTrialManager' },
    params: {
      trialId: aTrialId,
    },
  });
