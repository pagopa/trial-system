import { mock, mockFn } from 'vitest-mock-extended';
import { Capabilities } from '../capabilities';

export const makeTestEnv = () => ({
  subscriptionReader: mock<Capabilities['subscriptionReader']>(),
  subscriptionWriter: mock<Capabilities['subscriptionWriter']>(),
  subscriptionRequestWriter: mock<Capabilities['subscriptionRequestWriter']>(),
  subscriptionHistoryReader: mock<Capabilities['subscriptionHistoryReader']>(),
  subscriptionHistoryWriter: mock<Capabilities['subscriptionHistoryWriter']>(),
  activationJobReader: mock<Capabilities['activationJobReader']>(),
  activationJobWriter: mock<Capabilities['activationJobWriter']>(),
  activationRequestRepository:
    mock<Capabilities['activationRequestRepository']>(),
  eventWriter: mock<Capabilities['eventWriter']>(),
  clock: mock<Capabilities['clock']>(),
  hashFn: mockFn<Capabilities['hashFn']>(),
  monotonicIdFn: mockFn<Capabilities['monotonicIdFn']>(),
});
