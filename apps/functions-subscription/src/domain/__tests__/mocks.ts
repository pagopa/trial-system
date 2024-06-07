import { vi } from 'vitest';

export const makeTestEnv = () => {
  const subscriptionReaderMock = {
    get: vi.fn(),
  };
  const subscriptionWriterMock = {
    insert: vi.fn(),
  };
  const subscriptionRequestWriterMock = {
    insert: vi.fn(),
  };
  const subscriptionHistoryWriterMock = {
    insert: vi.fn(),
  };
  const hashFnMock = vi.fn();
  const clockMock = {
    now: vi.fn(),
  };

  const activationServiceMock = {
    fetchActivationRequestItemsToActivate: vi.fn(),
    activateRequestItems: vi.fn(),
  };

  return {
    subscriptionReader: subscriptionReaderMock,
    subscriptionWriter: subscriptionWriterMock,
    subscriptionRequestWriter: subscriptionRequestWriterMock,
    subscriptionHistoryWriter: subscriptionHistoryWriterMock,
    activationConsumer: activationServiceMock,
    hashFn: hashFnMock,
    clock: clockMock,
  };
};
