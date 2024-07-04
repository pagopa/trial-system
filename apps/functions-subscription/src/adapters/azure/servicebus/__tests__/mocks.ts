import { mockDeep, mockFn } from 'vitest-mock-extended';
import { ServiceBusManagementClient } from '@azure/arm-servicebus';
import { ServiceBusSender } from '@azure/service-bus';
import { ManagedServiceIdentityClient } from '@azure/arm-msi';
import { AuthorizationManagementClient } from '@azure/arm-authorization';
import { UUIDFn } from '../../../crypto/uuid';

export const makeServiceBusMocks = () => ({
  sender: mockDeep<ServiceBusSender>(),
  serviceBusManagementClient: mockDeep<ServiceBusManagementClient>(),
  managedServiceIdentityClient: mockDeep<ManagedServiceIdentityClient>(),
  authorizationManagementClient: mockDeep<AuthorizationManagementClient>(),
  uuidFn: mockFn<UUIDFn>(),
});
