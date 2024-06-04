import { SubscriptionId, TrialId, UserId } from '../subscription';

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

export const anActivationRequest = {
  id: 'anId',
  userId: aUserId,
  trialId: aTrialId,
  createdAt: new Date(),
  type: 'request' as const,
  isActive: false,
};
