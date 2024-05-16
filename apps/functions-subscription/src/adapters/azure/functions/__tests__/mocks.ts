import { InvocationContext } from '@azure/functions';
import { vi } from 'vitest';

export const makeFunctionContext = () =>
  ({
    error: console.error,
    debug: console.debug,
  }) as InvocationContext;

export const makeSystemEnv = () => {
  const insertSubscriptionUCMock = vi.fn();
  return {
    insertSubscription: insertSubscriptionUCMock,
  };
};
