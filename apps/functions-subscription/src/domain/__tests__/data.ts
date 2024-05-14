import { SubscriptionId, TrialId, UserId } from '../subscription';

const aSubscriptionId = 'aSubscriptionId' as SubscriptionId;
const aUserId = 'aUserId' as UserId;
const aTrialId = 'aTrialId' as TrialId;

export const aSubscription = {
  id: aSubscriptionId,
  userId: aUserId,
  trialId: aTrialId,
};

export const aSubscriptionRequest = {
  userId: aUserId,
  trialId: aTrialId,
};
