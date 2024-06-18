import { NonNegativeInteger } from '@pagopa/ts-commons/lib/numbers';
import { SubscriptionId, TrialId, UserId } from '../subscription';
import { SubscriptionHistoryId } from '../subscription-history';
import { ActivationRequestId } from '../activation-request';
import { ActivationJobId } from '../activation-job';

const aSubscriptionHistoryIdV0 =
  'aSubscriptionHistoryIdV0' as SubscriptionHistoryId;
const aSubscriptionHistoryIdV1 =
  'aSubscriptionHistoryIdV1' as SubscriptionHistoryId;
const aSubscriptionId = 'aSubscriptionId' as SubscriptionId;
const aUserId = 'aUserId' as UserId;
const aTrialId = 'aTrialId' as TrialId;
const anActivationJobId = 'anActivationJobId' as ActivationJobId;
const anActivationRequestId = 'anActivationRequestId' as ActivationRequestId;

export const aSubscription = {
  id: aSubscriptionId,
  userId: aUserId,
  trialId: aTrialId,
  createdAt: new Date(),
  updatedAt: new Date(),
  state: 'SUBSCRIBED' as const,
};

export const aSubscriptionRequest = {
  userId: aUserId,
  trialId: aTrialId,
};

export const aSubscriptionHistory = {
  id: aSubscriptionHistoryIdV0,
  subscriptionId: aSubscriptionId,
  userId: aUserId,
  trialId: aTrialId,
  createdAt: aSubscription.createdAt,
  updatedAt: aSubscription.updatedAt,
  state: 'SUBSCRIBED' as const,
  version: 0 as NonNegativeInteger,
};

export const aSubscriptionHistoryV1 = {
  id: aSubscriptionHistoryIdV1,
  subscriptionId: aSubscriptionId,
  userId: aUserId,
  trialId: aTrialId,
  createdAt: aSubscriptionHistory.createdAt,
  updatedAt: new Date(),
  state: 'ACTIVE' as const,
  version: 1 as NonNegativeInteger,
};

export const anActivationJob = {
  id: anActivationJobId,
  trialId: aTrialId,
  createdAt: new Date(),
  usersToActivate: 100 as NonNegativeInteger,
  usersActivated: 0 as NonNegativeInteger,
  type: 'job' as const,
};

export const anInsertActivationRequest = {
  id: anActivationRequestId,
  userId: aUserId,
  trialId: aTrialId,
  activated: false,
  type: 'request' as const,
};
export const anActivationRequest = {
  ...anInsertActivationRequest,
  _etag: 'anEtag',
};
export const anActivationRequestActivated = {
  ...anInsertActivationRequest,
  activated: true,
  _etag: 'anEtag',
};
