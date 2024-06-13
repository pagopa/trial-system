import { monotonicFactory } from 'ulid';
import { MonotonicIdFn } from '../../domain/monotonic-id';

const ulid = monotonicFactory();

export const monotonicIdFn: MonotonicIdFn = () => ({ value: ulid() });
