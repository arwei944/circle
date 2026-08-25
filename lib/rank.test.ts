import { describe, expect, it } from 'vitest';
import { computeRankBetween, topRankFrom } from './rank';

describe('computeRankBetween', () => {
   it('returns a value strictly between two ranks', () => {
      const lo = 'a3c';
      const hi = 'a3g';
      const mid = computeRankBetween(lo, hi);
      expect(mid).toBeTruthy();
      expect(mid > lo && mid < hi).toBe(true);
   });

   it('handles open upper bound (lo only)', () => {
      const mid = computeRankBetween('a3c', null);
      expect(mid > 'a3c').toBe(true);
   });

   it('handles open lower bound (hi only)', () => {
      const mid = computeRankBetween(null, 'a3c');
      expect(mid < 'a3c').toBe(true);
   });

   it('never equals either bound even when adjacent', () => {
      for (let i = 0; i < 20; i++) {
         const mid = computeRankBetween('a3m', 'a3n');
         expect(mid === 'a3m' || mid === 'a3n').toBe(false);
      }
   });
});

describe('topRankFrom', () => {
   it('returns a rank larger than the current top', () => {
      expect(topRankFrom('a3c') > 'a3c').toBe(true);
   });
   it('falls back to a3c when empty', () => {
      expect(topRankFrom(null)).toBe('a3c');
   });
});
