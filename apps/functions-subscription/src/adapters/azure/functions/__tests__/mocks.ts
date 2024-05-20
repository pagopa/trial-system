import { InvocationContext } from '@azure/functions';
import { vi } from 'vitest';
import { InfoEnv } from '../info';

export const makeFunctionContext = () =>
  ({
    error: console.error,
    debug: console.debug,
  }) as InvocationContext;

export const makeTestSystemEnv = () => {
  const insertSubscriptionUCMock = vi.fn();
  return {
    insertSubscription: insertSubscriptionUCMock,
  };
};

export const makeTestInfoEnv = () => {
  const mocks = {
    cosmosDB: {
      getDatabaseAccount: vi.fn(),
    },
    subscriptionRequestEventHub: {
      getEventHubProperties: vi.fn(),
    },
  };
  return { env: mocks as unknown as InfoEnv, mocks };
};
