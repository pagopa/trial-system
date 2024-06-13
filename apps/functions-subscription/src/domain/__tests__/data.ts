import {
  NonNegativeInteger,
  NonNegativeNumber,
} from '@pagopa/ts-commons/lib/numbers';
import { SubscriptionId, TrialId, UserId } from '../subscription';
import { SubscriptionHistoryId } from '../subscription-history';
import { ActivationRequestId } from '../activation-request';
import { ActivationJobId } from '../activation-job';
import { MonotonicIdFn } from '../monotonic-id';

const aSubscriptionHistoryId =
  'aSubscriptionHistoryId' as SubscriptionHistoryId;
const aSubscriptionId = 'aSubscriptionId' as SubscriptionId;
const aUserId = 'aUserId' as UserId;
const aTrialId = 'aTrialId' as TrialId;
const anActivationJobId = 'anActivationJobId' as ActivationJobId;
const anActivationRequestId = 'anActivationRequestId' as ActivationRequestId;
export const aMonotonicId = {
  value: '01J06GDVZJCDZ0RCM543KN4DR6',
} as ReturnType<MonotonicIdFn>;

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
  id: aSubscriptionHistoryId,
  subscriptionId: aSubscriptionId,
  userId: aUserId,
  trialId: aTrialId,
  createdAt: new Date(),
  updatedAt: new Date(),
  state: 'SUBSCRIBED' as const,
  version: 0 as NonNegativeInteger,
};

export const anActivationJob = {
  id: anActivationJobId,
  trialId: aTrialId,
  createdAt: new Date(),
  usersToActivate: 100 as NonNegativeNumber,
  usersActivated: 0 as NonNegativeNumber,
  type: 'job' as const,
  _etag: 'anEtag',
};

export const anActivationRequestWithoutEtag = {
  id: anActivationRequestId,
  userId: aUserId,
  trialId: aTrialId,
  activated: false,
  type: 'request' as const,
};
export const anActivationRequest = {
  ...anActivationRequestWithoutEtag,
  _etag: 'anEtag',
};
