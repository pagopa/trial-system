import { flow, apply } from 'fp-ts/lib/function';
import { Capabilities } from './domain/capabilities';
import { insertSubscription } from './use-cases/insert-subscription';
import { getSubscription } from './use-cases/get-subscription';
import { processSubscriptionRequest } from './use-cases/process-subscription-request';
import { processActivationJob } from './use-cases/process-activation-job';
import { processActivationRequest } from './use-cases/process-activation-request';
import {
  getActivationJob,
  insertActivationJob,
  updateActivationJob,
} from './domain/activation-job';

export const makeSystemEnv = (capabilities: Capabilities) => ({
  insertSubscription: flow(insertSubscription, apply(capabilities)),
  getSubscription: flow(getSubscription, apply(capabilities)),
  processSubscriptionRequest: flow(
    processSubscriptionRequest,
    apply(capabilities),
  ),
  processActivationJob: flow(processActivationJob, apply(capabilities)),
  processActivationRequest: flow(processActivationRequest, apply(capabilities)),
  insertActivationJob: flow(insertActivationJob, apply(capabilities)),
  getActivationJob: flow(getActivationJob, apply(capabilities)),
  updateActivationJob: flow(updateActivationJob, apply(capabilities)),
});

export type SystemEnv = ReturnType<typeof makeSystemEnv>;
