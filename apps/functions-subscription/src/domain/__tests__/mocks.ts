import { vi } from 'vitest';

export const makeTestEnv = () => {
  const subscriptionReaderMock = {
    get: vi.fn(),
  };
  const subscriptionWriterMock = {
    insert: vi.fn(),
    upsert: vi.fn(),
  };
  const subscriptionRequestWriterMock = {
    insert: vi.fn(),
  };
  const subscriptionHistoryReaderMock = {
    getLatest: vi.fn(),
  };
  const subscriptionHistoryWriterMock = {
    insert: vi.fn(),
  };
  const eventWriterMock = {
    send: vi.fn(),
  };
  const hashFnMock = vi.fn();
  const clockMock = {
    now: vi.fn(),
  };
  const monotonicIdFnMock = vi.fn();

  const activationRequestRepositoryMock = {
    insert: vi.fn(),
    list: vi.fn(),
    activate: vi.fn(),
  };

  return {
    subscriptionReader: subscriptionReaderMock,
    subscriptionWriter: subscriptionWriterMock,
    subscriptionRequestWriter: subscriptionRequestWriterMock,
    subscriptionHistoryReader: subscriptionHistoryReaderMock,
    subscriptionHistoryWriter: subscriptionHistoryWriterMock,
    activationRequestRepository: activationRequestRepositoryMock,
    eventWriter: eventWriterMock,
    hashFn: hashFnMock,
    clock: clockMock,
    monotonicIdFn: monotonicIdFnMock,
  };
};
