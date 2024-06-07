import { flow, apply } from 'fp-ts/lib/function';
import { Capabilities } from './domain/capabilities';
import { insertSubscription } from './use-cases/insert-subscription';
import { getSubscription } from './use-cases/get-subscription';
import { processSubscriptionRequest } from './use-cases/process-subscription-request';
import { processActivationJob } from './use-cases/process-activation-job';
import { Config } from './config';

export const makeSystemEnv = (capabilities: Capabilities, config: Config) => ({
  insertSubscription: flow(insertSubscription, apply(capabilities)),
  getSubscription: flow(getSubscription, apply(capabilities)),
  processSubscriptionRequest: flow(
    processSubscriptionRequest,
    apply(capabilities),
  ),
  processActivationJob: flow(processActivationJob(config), apply(capabilities)),
});

export type SystemEnv = ReturnType<typeof makeSystemEnv>;
