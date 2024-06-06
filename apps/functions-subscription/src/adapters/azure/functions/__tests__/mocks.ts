import { InvocationContext } from '@azure/functions';
import { vi } from 'vitest';
import { InfoEnv } from '../info';

export const makeFunctionContext = () =>
  ({
    error: console.error,
    debug: console.debug,
  }) as InvocationContext;

export const makeTestSystemEnv = () => {
  const insertSubscriptionMock = vi.fn();
  const processSubscriptionRequestMock = vi.fn();
  const getSubscriptionMock = vi.fn();
  return {
    insertSubscription: insertSubscriptionMock,
    processSubscriptionRequest: processSubscriptionRequestMock,
    getSubscription: getSubscriptionMock,
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
