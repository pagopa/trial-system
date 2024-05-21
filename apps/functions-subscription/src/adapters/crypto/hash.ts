import crypto from 'crypto';
import { HashFn } from '../../domain/hash';

export const hashFn: HashFn = (str: string) => ({
  value: crypto.createHash('md5').update(str).digest('hex'),
});
