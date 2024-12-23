import { vi } from 'vitest';
import { mockFn } from 'vitest-mock-extended';
import { InvocationContext } from '@azure/functions';
import { InfoEnv } from '../info';
import { SystemEnv } from '../../../../system-env';

export const makeFunctionContext = () =>
  ({
    error: console.error,
    debug: console.debug,
  }) as InvocationContext;

export const makeTestSystemEnv = () => ({
  createSubscription: mockFn<SystemEnv['createSubscription']>(),
  processSubscriptionRequest: mockFn<SystemEnv['processSubscriptionRequest']>(),
  getSubscription: mockFn<SystemEnv['getSubscription']>(),
  updateSubscription: mockFn<SystemEnv['updateSubscription']>(),
  processActivationJob: mockFn<SystemEnv['processActivationJob']>(),
  processActivationRequest: mockFn<SystemEnv['processActivationRequest']>(),
  createTrial: mockFn<SystemEnv['createTrial']>(),
  getTrial: mockFn<SystemEnv['getTrial']>(),
  listTrials: mockFn<SystemEnv['listTrials']>(),
  getActivationJob: mockFn<SystemEnv['getActivationJob']>(),
  updateActivationJob: mockFn<SystemEnv['updateActivationJob']>(),
});

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
