import { describe, expect, it } from 'vitest';
import { hashFn } from '../hash';

describe('hash', () => {
  it('should produce different hash given different string', () => {
    expect(hashFn('str0')).not.toStrictEqual(hashFn('str1'));
  });
  it('should produce same result given the same string', () => {
    expect(hashFn('str0')).toStrictEqual(hashFn('str0'));
  });
});
