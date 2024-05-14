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
  const hashFnMock = vi.fn();

  return {
    subscriptionReader: subscriptionReaderMock,
    subscriptionWriter: subscriptionWriterMock,
    subscriptionRequestWriter: subscriptionRequestWriterMock,
    hashFn: hashFnMock,
  };
};
