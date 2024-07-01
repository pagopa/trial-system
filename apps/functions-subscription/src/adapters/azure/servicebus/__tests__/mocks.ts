import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ServiceBusAdministrationClient } from '@azure/service-bus';

export const makeServiceBusMock = () => {
  return {
    sendMessages: vi.fn(),
  };
};

export const makeServiceBusMocks = () => ({
  adminClient: mock<ServiceBusAdministrationClient>(),
});
