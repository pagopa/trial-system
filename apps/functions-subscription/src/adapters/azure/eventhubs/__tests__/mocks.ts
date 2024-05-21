import { vi } from 'vitest';

export const makeEventHubMock = () => {
  return {
    sendBatch: vi.fn(),
  };
};
