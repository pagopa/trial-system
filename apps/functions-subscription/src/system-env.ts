import { flow, apply } from 'fp-ts/lib/function';
import { Capabilities } from './domain/capabilities';
import { createSubscription } from './use-cases/create-subscription';
import { getSubscription } from './use-cases/get-subscription';
import { processSubscriptionRequest } from './use-cases/process-subscription-request';
import { processActivationJob } from './use-cases/process-activation-job';
import { processActivationRequest } from './use-cases/process-activation-request';
import { getActivationJob, updateActivationJob } from './domain/activation-job';
import { insertTrial, getTrialById } from './domain/trial';

export const makeSystemEnv = (capabilities: Capabilities) => ({
  createSubscription: flow(createSubscription, apply(capabilities)),
  getSubscription: flow(getSubscription, apply(capabilities)),
  processSubscriptionRequest: flow(
    processSubscriptionRequest,
    apply(capabilities),
  ),
  processActivationJob: flow(processActivationJob, apply(capabilities)),
  processActivationRequest: flow(processActivationRequest, apply(capabilities)),
  getActivationJob: flow(getActivationJob, apply(capabilities)),
  updateActivationJob: flow(updateActivationJob, apply(capabilities)),
  createTrial: flow(insertTrial, apply(capabilities)),
  getTrial: flow(getTrialById, apply(capabilities)),
});

export type SystemEnv = ReturnType<typeof makeSystemEnv>;
