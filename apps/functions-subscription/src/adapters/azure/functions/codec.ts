import { ActivationJob } from '../../../domain/activation-job';
import { Subscription } from '../../../domain/subscription';
import { Trial } from '../../../domain/trial';
import { ActivationJob as ActivationJobAPI } from '../../../generated/definitions/internal/ActivationJob';
import { Subscription as SubscriptionAPI } from '../../../generated/definitions/internal/Subscription';
import { SubscriptionStateEnum } from '../../../generated/definitions/internal/SubscriptionState';
import { TrialStateEnum } from '../../../generated/definitions/internal/TrialState';
import { PartialTrial as PartialTrialAPI } from '../../../generated/definitions/internal/PartialTrial';
import { Trial as TrialAPI } from '../../../generated/definitions/internal/Trial';

export const toSubscriptionAPI = (
  subscription: Subscription,
): SubscriptionAPI => ({
  trialId: subscription.trialId,
  userId: subscription.userId,
  state: SubscriptionStateEnum[subscription.state],
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
});

export const toActivationJobAPI = (
  activationJob: ActivationJob,
): ActivationJobAPI => ({
  trialId: activationJob.trialId,
  usersActivated: activationJob.usersActivated,
  usersToActivate: activationJob.usersToActivate,
});

export const toPartialTrialAPI = (trial: Trial): PartialTrialAPI => ({
  id: trial.id,
  state: TrialStateEnum[trial.state],
});

// TODO: Complete with missing information
export const toTrialAPI = (trial: Trial): TrialAPI => ({
  ...toPartialTrialAPI(trial),
  name: trial.name,
  description: trial.description,
});
