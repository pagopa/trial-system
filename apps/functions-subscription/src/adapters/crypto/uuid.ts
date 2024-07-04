import crypto from 'crypto';

export const uuidFn = () => ({
  value: crypto.randomUUID(),
});
