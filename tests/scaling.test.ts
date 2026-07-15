import { describe, expect, it } from 'vitest';

import { scaleBatch, scaleQuantity } from '../src/lib/scaling';

describe('servings and marinade scaling', () => {
  it('scales quantities deterministically', () => {
    expect(scaleQuantity(500, 4, 8)).toBe(1000);
    expect(scaleBatch([1, 2.5, 10], 4, 2)).toEqual([0.5, 1.25, 5]);
  });

  it('rejects invalid scaling inputs', () => {
    expect(() => scaleQuantity(1, 0, 4)).toThrow(/greater than zero/);
    expect(() => scaleQuantity(Number.NaN, 4, 8)).toThrow(/finite/);
  });
});
