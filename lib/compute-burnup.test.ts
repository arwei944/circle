import { describe, expect, it } from 'vitest';
import { computeBurnup } from './compute-burnup';

describe('computeBurnup', () => {
   it('returns one point per day inclusive of both endpoints', () => {
      const points = computeBurnup('2026-01-01', '2026-01-04', []);
      expect(points.map((p) => p.date)).toEqual([
         '2026-01-01',
         '2026-01-02',
         '2026-01-03',
         '2026-01-04',
      ]);
   });

   it('empty issues: scope/started/completed 0 at every point', () => {
      const points = computeBurnup('2026-01-01', '2026-01-03', []);
      for (const p of points) {
         expect(p.scope).toBe(0);
         expect(p.started).toBe(0);
         expect(p.completed).toBe(0);
      }
      // scopeTotal=0 → ideal 恒 0（单调不减）
      expect(points.every((p) => p.ideal === 0)).toBe(true);
   });

   it('scope counts an issue only from its createdAt day onward', () => {
      const points = computeBurnup('2026-01-01', '2026-01-04', [
         { createdAt: '2026-01-02', completedAt: null },
      ]);
      expect(points.map((p) => p.scope)).toEqual([0, 1, 1, 1]);
   });

   it('completed curve counts issues completed by each day', () => {
      const points = computeBurnup('2026-01-01', '2026-01-04', [
         { createdAt: '2026-01-02', completedAt: '2026-01-03' },
      ]);
      expect(points.map((p) => p.completed)).toEqual([0, 0, 1, 1]);
      expect(points.map((p) => p.started)).toEqual([0, 1, 0, 0]);
   });

   it('started = scope - completed at every point', () => {
      const points = computeBurnup('2026-01-01', '2026-01-03', [
         { createdAt: '2026-01-01', completedAt: '2026-01-02' },
      ]);
      for (const p of points) expect(p.started).toBe(p.scope - p.completed);
   });

   it('ideal ramps linearly toward total scope', () => {
      const points = computeBurnup('2026-01-01', '2026-01-04', [
         { createdAt: '2026-01-01', completedAt: null },
         { createdAt: '2026-01-01', completedAt: null },
      ]);
      // scopeTotal=2, totalDays+1=4 → ideal = round(2*(i+1)/4)
      expect(points.map((p) => p.ideal)).toEqual([1, 1, 2, 2]);
   });

   it('start === end produces exactly one point', () => {
      const points = computeBurnup('2026-01-05', '2026-01-05', [
         { createdAt: '2026-01-05', completedAt: null },
      ]);
      expect(points).toHaveLength(1);
      expect(points[0].date).toBe('2026-01-05');
      expect(points[0].scope).toBe(1);
   });
});
