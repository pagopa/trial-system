import { ActivationJob } from '../../../domain/activation-job';
import { Subscription } from '../../../domain/subscription';
import { Trial } from '../../../domain/trial';
import { ActivationJob as ActivationJobAPI } from '../../../generated/definitions/internal/ActivationJob';
import { Subscription as SubscriptionAPI } from '../../../generated/definitions/internal/Subscription';
import { SubscriptionStateEnum } from '../../../generated/definitions/internal/SubscriptionState';
import { TrialStateEnum } from '../../../generated/definitions/internal/TrialState';
import { Trial as TrialAPI } from '../../../generated/definitions/internal/Trial';
import { ActivationRequest } from '../../../domain/activation-request';
import { UpdatedSubscription } from '../../../generated/definitions/internal/UpdatedSubscription';
import { TrialPaginatedCollection } from '../../../generated/definitions/internal/TrialPaginatedCollection';
import { TrialSlim } from '../../../generated/definitions/internal/TrialSlim';

export const toSubscriptionAPI = (
  subscription: Subscription,
): SubscriptionAPI => ({
  trialId: subscription.trialId,
  userId: subscription.userId,
  state: SubscriptionStateEnum[subscription.state],
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
});

export const toUpdatedSubscription = (
  activationRequest: ActivationRequest,
): UpdatedSubscription => ({
  trialId: activationRequest.trialId,
  userId: activationRequest.userId,
  state: SubscriptionStateEnum[activationRequest.state],
});

export const toActivationJobAPI = (
  activationJob: ActivationJob,
): ActivationJobAPI => ({
  trialId: activationJob.trialId,
  usersActivated: activationJob.usersActivated,
  usersToActivate: activationJob.usersToActivate,
});

export const toTrialAPI = (trial: Trial): TrialAPI => {
  const { id, name, description, state } = trial;
  const trialAPI = {
    id,
    name,
    state: TrialStateEnum[state],
    description,
  };

  return state === 'CREATED'
    ? {
        ...trialAPI,
        channel: {
          azure: {
            identityId: trial.identityId,
            queueName: id,
          },
        },
      }
    : trialAPI;
};

export const toTrialSlimAPI = (trial: Trial): TrialSlim => {
  const { id, name, description, state } = trial;
  return {
    id,
    name,
    state: TrialStateEnum[state],
    description,
  };
};

export const toTrialListAPI = (
  trials: readonly Trial[],
): TrialPaginatedCollection => {
  return {
    items: trials.map(toTrialSlimAPI),
    previousId: trials[trials.length - 1]?.id,
    nextId: trials[0]?.id,
  };
};
