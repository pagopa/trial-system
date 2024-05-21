import { flow, apply } from 'fp-ts/lib/function';
import { insertSubscription } from './use-cases/insert-subscription';
import { getSubscription } from './use-cases/get-subscription';
import { Capabilities } from './domain/capabilities';

export const makeSystemEnv = (capabilities: Capabilities) => ({
  insertSubscription: flow(insertSubscription, apply(capabilities)),
  getSubscription: flow(getSubscription, apply(capabilities)),
});

export type SystemEnv = ReturnType<typeof makeSystemEnv>;
