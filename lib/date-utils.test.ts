import { describe, expect, it } from 'vitest';
import { toLocalDateString } from './date-utils';

describe('toLocalDateString', () => {
   it('serializes a local-midnight Date in local calendar day', () => {
      // 本地时间构造（非 UTC），防止 UTC+X 时区把 2026-01-15 回退成 2026-01-14
      expect(toLocalDateString(new Date(2026, 0, 15))).toBe('2026-01-15');
   });

   it('zero-pads month and day', () => {
      expect(toLocalDateString(new Date(2026, 0, 9))).toBe('2026-01-09');
      expect(toLocalDateString(new Date(2026, 11, 1))).toBe('2026-12-01');
   });

   it('round-trips through yyyy-MM-dd + T00:00:00 parse', () => {
      const d = new Date(2026, 0, 15);
      const iso = toLocalDateString(d);
      // 只把结果解析回本地零点 Date，getTime 必须与原始 Date 一致
      expect(new Date(`${iso}T00:00:00`).getTime()).toBe(d.getTime());
   });
});
