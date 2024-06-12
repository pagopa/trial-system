import { monotonicFactory } from 'ulid';
import { MonotonicId } from '../../domain/monotonic-id';

const ulid = monotonicFactory();

export const monotonicId: MonotonicId = () => ({ value: ulid() });
