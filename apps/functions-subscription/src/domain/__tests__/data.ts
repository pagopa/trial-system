import { NonNegativeInteger } from '@pagopa/ts-commons/lib/numbers';
import { SubscriptionId, UserId } from '../subscription';
import { SubscriptionHistoryId } from '../subscription-history';
import { ActivationRequestId } from '../activation-request';
import { TrialId } from '../trial';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { TenantId } from '../users';

const aSubscriptionHistoryIdV0 =
  'aSubscriptionHistoryIdV0' as SubscriptionHistoryId;
const aSubscriptionHistoryIdV1 =
  'aSubscriptionHistoryIdV1' as SubscriptionHistoryId;
const aSubscriptionId = 'aSubscriptionId' as SubscriptionId;
const aUserId = 'aUserId' as UserId;
const aTrialId = 'aTrialId' as TrialId;
const anActivationRequestId = 'anActivationRequestId' as ActivationRequestId;

export const aTrialOwner = {
  type: 'owner' as const,
  id: 'aTrialOwnerId' as TenantId,
};

export const aTrialSubscriber = {
  type: 'subscriber' as const,
  id: 'aTrialSubscriberId' as TenantId,
};

export const aSubscription = {
  id: aSubscriptionId,
  userId: aUserId,
  trialId: aTrialId,
  createdAt: new Date(),
  updatedAt: new Date(),
  state: 'SUBSCRIBED' as const,
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
  trialId: aTrialId,
  usersToActivate: 100 as NonNegativeInteger,
  usersActivated: 0 as NonNegativeInteger,
  type: 'job' as const,
};

export const anInsertActivationRequest = {
  id: anActivationRequestId,
  userId: aUserId,
  trialId: aTrialId,
  state: 'SUBSCRIBED' as const,
  type: 'request' as const,
};
export const anActivationRequest = {
  ...anInsertActivationRequest,
  _etag: 'anEtag',
};
export const anActivationRequestActivated = {
  ...anInsertActivationRequest,
  state: 'ACTIVE' as const,
  _etag: 'anEtag',
};

export const aTrial = {
  id: aTrialId,
  name: 'aTrialName' as NonEmptyString,
  description: 'aTrialDescription',
  state: 'CREATING' as const,
  ownerId: aTrialOwner.id,
};

export const aCreatedTrial = {
  ...aTrial,
  state: 'CREATED' as const,
  identityId: 'anIdentityId' as NonEmptyString,
};

export const aTrial1 = {
  ...aTrial,
  id: 'a1' as TrialId,
  name: 'n1' as NonEmptyString,
  description: 'd1',
};
export const aTrial2 = {
  ...aTrial,
  id: 'a2' as TrialId,
  name: 'n2' as NonEmptyString,
  description: 'd2',
};
