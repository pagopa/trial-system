import { flow, apply } from 'fp-ts/lib/function';
import { insertSubscription } from './use-cases/insert-subscription';
import { Capabilities } from './domain/capabilities';

export const makeSystemEnv = (capabilities: Capabilities) => ({
  insertSubscription: flow(insertSubscription, apply(capabilities)),
});

export type SystemEnv = ReturnType<typeof makeSystemEnv>;
