import { format } from 'date-fns';

export interface BurnupIssueLike {
   createdAt: string; // 'yyyy-MM-dd'
   completedAt: string | null; // 'yyyy-MM-dd' | null
}

export interface CycleBurnupPoint {
   date: string; // 'yyyy-MM-dd'
   scope: number;
   started: number;
   completed: number;
   ideal: number;
}

/**
 * 逐日燃尽（burn-up）曲线：由外部传入的真实 issue 数据计算，方便单测。
 * - 空 issues → 每个点 scope/started/completed=0（ideal 依公式单调不减，scopeTotal=0 时恒 0）。
 * - totalDays=Math.min(365, Math.max(0, …))：start===end 时仅 1 个点（控制器
 *   ruling），正常区间含两端端点；跨年区间按规格截断为 ≤366 点。
 */
export function computeBurnup(
   startDate: string,
   endDate: string,
   issues: BurnupIssueLike[]
): CycleBurnupPoint[] {
   const start = new Date(startDate + 'T00:00:00');
   const end = new Date(endDate + 'T00:00:00');
   const totalDays = Math.min(
      365,
      Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
   );
   const scopeTotal = issues.length;
   const points: CycleBurnupPoint[] = [];
   for (let i = 0; i <= totalDays; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const date = format(day, 'yyyy-MM-dd');
      const scope = issues.filter((x) => x.createdAt <= date).length;
      const completed = issues.filter((x) => x.completedAt && x.completedAt <= date).length;
      const ideal = Math.round((scopeTotal * (i + 1)) / (totalDays + 1));
      points.push({ date, scope, started: scope - completed, completed, ideal });
   }
   return points;
}
