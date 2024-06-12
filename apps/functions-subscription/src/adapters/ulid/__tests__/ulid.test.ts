import { describe, expect, it } from 'vitest';
import { monotonicId } from '../monotonic-id';

describe('monotonicId', () => {
  const { value: firstId } = monotonicId();
  const { value: secondId } = monotonicId();
  it('should produce different ids', () => {
    expect(firstId).not.toStrictEqual(secondId);
  });
  it('should produce ordered ids', () => {
    expect(firstId < secondId).toStrictEqual(true);
  });
});
