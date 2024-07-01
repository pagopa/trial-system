import { mock, mockFn } from 'vitest-mock-extended';
import { Capabilities } from '../capabilities';

export const makeTestEnv = () => ({
  subscriptionReader: mock<Capabilities['subscriptionReader']>(),
  subscriptionWriter: mock<Capabilities['subscriptionWriter']>(),
  subscriptionQueue: mock<Capabilities['subscriptionQueue']>(),
  subscriptionHistoryReader: mock<Capabilities['subscriptionHistoryReader']>(),
  subscriptionHistoryWriter: mock<Capabilities['subscriptionHistoryWriter']>(),
  activationJobReader: mock<Capabilities['activationJobReader']>(),
  activationJobWriter: mock<Capabilities['activationJobWriter']>(),
  activationRequestReader: mock<Capabilities['activationRequestReader']>(),
  activationRequestWriter: mock<Capabilities['activationRequestWriter']>(),
  trialWriter: mock<Capabilities['trialWriter']>(),
  trialReader: mock<Capabilities['trialReader']>(),
  eventWriter: mock<Capabilities['eventWriter']>(),
  eventQueue: mock<Capabilities['eventQueue']>(),
  eventTopic: mock<Capabilities['eventTopic']>(),
  identityWriter: mock<Capabilities['identityWriter']>(),
  clock: mock<Capabilities['clock']>(),
  hashFn: mockFn<Capabilities['hashFn']>(),
  monotonicIdFn: mockFn<Capabilities['monotonicIdFn']>(),
  uuidFn: mockFn<Capabilities['uuidFn']>(),
});
