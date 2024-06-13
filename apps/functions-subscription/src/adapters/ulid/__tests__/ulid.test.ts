import { describe, expect, it } from 'vitest';
import { monotonicIdFn } from '../monotonic-id';

describe('monotonicIdFn', () => {
  const { value: firstId } = monotonicIdFn();
  const { value: secondId } = monotonicIdFn();
  it('should produce different ids', () => {
    expect(firstId).not.toStrictEqual(secondId);
  });
  it('should produce ordered ids', () => {
    expect(firstId < secondId).toStrictEqual(true);
  });
});
