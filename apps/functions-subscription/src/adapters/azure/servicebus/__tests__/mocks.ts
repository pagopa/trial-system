import { vi } from 'vitest';

export const makeServiceBusMock = () => {
  return {
    sendMessages: vi.fn(),
  };
};
