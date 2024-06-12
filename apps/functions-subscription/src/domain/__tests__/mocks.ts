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

  const activationRequestRepositoryMock = {
    list: vi.fn(),
    activate: vi.fn(),
  };

  return {
    subscriptionReader: subscriptionReaderMock,
    subscriptionWriter: subscriptionWriterMock,
    subscriptionRequestWriter: subscriptionRequestWriterMock,
    subscriptionHistoryWriter: subscriptionHistoryWriterMock,
    activationRequestRepository: activationRequestRepositoryMock,
    eventWriter: eventWriterMock,
    hashFn: hashFnMock,
    clock: clockMock,
  };
};
