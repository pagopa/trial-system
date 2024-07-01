import { mockDeep } from 'vitest-mock-extended';
import { ServiceBusManagementClient } from '@azure/arm-servicebus';
import { ServiceBusSender } from '@azure/service-bus';

export const makeServiceBusMocks = () => ({
  sender: mockDeep<ServiceBusSender>(),
  managementClient: mockDeep<ServiceBusManagementClient>(),
});
