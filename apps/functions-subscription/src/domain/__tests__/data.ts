import {
  NonNegativeInteger,
  NonNegativeNumber,
} from '@pagopa/ts-commons/lib/numbers';
import { SubscriptionId, TrialId, UserId } from '../subscription';
import { SubscriptionHistoryId } from '../subscription-history';

const aSubscriptionHistoryId =
  'aSubscriptionHistoryId' as SubscriptionHistoryId;
const aSubscriptionId = 'aSubscriptionId' as SubscriptionId;
const aUserId = 'aUserId' as UserId;
const aTrialId = 'aTrialId' as TrialId;

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
  trialId: aTrialId,
  createdAt: new Date(),
  usersToActivate: 100 as NonNegativeNumber,
  usersActivated: 0 as NonNegativeNumber,
  type: 'job' as const,
};

export const anActivationRequest = {
  id: 'anId',
  userId: aUserId,
  trialId: aTrialId,
  createdAt: new Date(),
  type: 'request' as const,
  isActive: false,
};
