import { mock, mockFn } from 'vitest-mock-extended';
import { SubscriptionReader, SubscriptionWriter } from '../subscription';
import { SubscriptionRequestWriter } from '../subscription-request';
import { SubscriptionHistoryWriter } from '../subscription-history';
import { EventWriter } from '../event';
import { ActivationRequestRepository } from '../activation-request';
import { Clock } from '../clock';
import { MonotonicIdFn } from '../monotonic-id';
import { HashFn } from '../hash';

export const makeTestEnv = () => {
  return {
    subscriptionReader: mock<SubscriptionReader>(),
    subscriptionWriter: mock<SubscriptionWriter>(),
    subscriptionRequestWriter: mock<SubscriptionRequestWriter>(),
    subscriptionHistoryWriter: mock<SubscriptionHistoryWriter>(),
    activationRequestRepository: mock<ActivationRequestRepository>(),
    eventWriter: mock<EventWriter>(),
    clock: mock<Clock>(),
    hashFn: mockFn<HashFn>(),
    monotonicIdFn: mockFn<MonotonicIdFn>(),
  };
};
