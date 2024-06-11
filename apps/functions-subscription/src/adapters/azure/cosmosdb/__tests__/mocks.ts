import { vi } from 'vitest';

export const makeDatabaseMock = () => {
  const container = {
    item: vi.fn(),
    items: {
      create: vi.fn(),
      upsert: vi.fn(),
      batch: vi.fn(),
      query: vi.fn(),
    },
  };
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    container: (_: string) => container,
  };
};
