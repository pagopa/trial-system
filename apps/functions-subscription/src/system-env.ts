import { flow, apply } from 'fp-ts/lib/function';
import { Capabilities } from './domain/capabilities';
import { insertSubscription } from './use-cases/insert-subscription';
import { processSubscriptionRequest } from './use-cases/process-subscription-request';

export const makeSystemEnv = (capabilities: Capabilities) => ({
  insertSubscription: flow(insertSubscription, apply(capabilities)),
  processSubscriptionRequest: flow(
    processSubscriptionRequest,
    apply(capabilities),
  ),
});

export type SystemEnv = ReturnType<typeof makeSystemEnv>;
