import crypto from 'crypto';

interface UUID {
  readonly value: string;
}

export type UUIDFn = () => UUID;

export const uuidFn: UUIDFn = () => ({
  value: crypto.randomUUID(),
});
