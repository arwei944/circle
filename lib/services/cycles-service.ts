import { asc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Db } from '@/db/client';
import { cycles, issues } from '@/db/schema';
import { computeBurnup, type CycleBurnupPoint } from '@/lib/compute-burnup';
import { toDateString, type LeanCycle } from '@/lib/dto';
import { status as statuses } from '@/mock-data/status';

/**
 * 派生自 mock-data/status 的 category，与全站状态定义保持单点事实源一致：
 * - COMPLETED_IDS = 'done','shipped'（category==='completed'）
 * - STARTED_IDS = 'in-progress','technical-review','paused','product-feedback','blocked'（category==='started'）
 */
const COMPLETED_IDS = statuses.filter((s) => s.category === 'completed').map((s) => s.id);
const STARTED_IDS = statuses.filter((s) => s.category === 'started').map((s) => s.id);

const VALID_CYCLE_STATUS = ['planned', 'upcoming', 'current', 'completed'];

export interface CreateCycleInput {
   name: string;
   teamId?: string;
   status?: string; // 'planned'|'upcoming'|'current'|'completed'
   startDate: string; // 'yyyy-MM-dd'
   endDate: string; // 'yyyy-MM-dd'
   capacity?: number;
}
export interface UpdateCycleInput extends Partial<CreateCycleInput> {}

type CycleAgg = {
   scope: number;
   started: number;
   completed: number;
   successRate: number;
   burnup?: CycleBurnupPoint[];
};

function assertCycleValid(name: string, startDate: string, endDate: string, status: string): void {
   if (!name.trim()) throw new Error('name required');
   if (!VALID_CYCLE_STATUS.includes(status)) throw new Error(`unknown cycle status: ${status}`);
   if (startDate > endDate) throw new Error('startDate must be <= endDate');
}

/** 从真实 issues 聚合 scope/started/completed/successRate；burnup 仅 status 为 current/completed 时计算。 */
function aggregate(db: Db, cycle: typeof cycles.$inferSelect): CycleAgg {
   const rows = db
      .select({
         createdAt: issues.createdAt,
         statusId: issues.statusId,
         completedAt: issues.completedAt,
      })
      .from(issues)
      .where(eq(issues.cycleId, cycle.id))
      .all();
   const scope = rows.length;
   const completed = rows.filter((r) => COMPLETED_IDS.includes(r.statusId)).length;
   const started = rows.filter((r) => STARTED_IDS.includes(r.statusId)).length;
   const successRate = scope > 0 ? Math.round((completed / scope) * 100) : 0;
   const withBurnup = cycle.status === 'current' || cycle.status === 'completed';
   const burnup = withBurnup
      ? computeBurnup(
           cycle.startDate,
           cycle.endDate,
           rows.map((r) => ({
              createdAt: toDateString(r.createdAt),
              completedAt: r.completedAt != null ? toDateString(r.completedAt) : null,
           }))
        )
      : undefined;
   return { scope, started, completed, successRate, burnup };
}

function toLean(row: typeof cycles.$inferSelect, agg: CycleAgg): LeanCycle {
   return {
      id: row.id,
      name: row.name,
      teamId: row.teamId,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      capacity: row.capacity,
      scope: agg.scope,
      started: agg.started,
      completed: agg.completed,
      successRate: agg.successRate,
      burnup: agg.burnup,
   };
}

export function listCycles(db: Db): LeanCycle[] {
   const rows = db.select().from(cycles).orderBy(asc(cycles.startDate)).all(); // startDate 升序 = 时间线顺序
   return rows.map((row) => toLean(row, aggregate(db, row)));
}

export function getCycle(db: Db, id: string): LeanCycle | null {
   const row = db.select().from(cycles).where(eq(cycles.id, id)).get();
   if (!row) return null;
   return toLean(row, aggregate(db, row));
}

export function createCycle(db: Db, input: CreateCycleInput): LeanCycle {
   const status = input.status ?? 'planned';
   assertCycleValid(input.name, input.startDate, input.endDate, status);
   const id = `cyc_${randomUUID()}`;
   db.$client.transaction(() => {
      db.insert(cycles)
         .values({
            id,
            name: input.name.trim(),
            teamId: input.teamId ?? 'CORE',
            status,
            startDate: input.startDate,
            endDate: input.endDate,
            capacity: input.capacity ?? 100,
         })
         .run();
   })();
   const created = getCycle(db, id);
   if (!created) throw new Error('create failed');
   return created;
}

export function updateCycle(db: Db, id: string, input: UpdateCycleInput): LeanCycle {
   const existing = db.select().from(cycles).where(eq(cycles.id, id)).get();
   if (!existing) throw new Error(`cycle not found: ${id}`);
   const name = input.name !== undefined ? input.name : existing.name;
   const startDate = input.startDate ?? existing.startDate;
   const endDate = input.endDate ?? existing.endDate;
   const status = input.status ?? existing.status;
   assertCycleValid(name, startDate, endDate, status);
   db.$client.transaction(() => {
      db.update(cycles)
         .set({
            name: name.trim(),
            teamId: input.teamId !== undefined ? input.teamId : existing.teamId,
            status,
            startDate,
            endDate,
            capacity: input.capacity !== undefined ? input.capacity : existing.capacity,
         })
         .where(eq(cycles.id, id))
         .run();
   })();
   const updated = getCycle(db, id);
   if (!updated) throw new Error('update failed');
   return updated;
}

export function deleteCycle(db: Db, id: string): boolean {
   const existing = db.select().from(cycles).where(eq(cycles.id, id)).get();
   if (!existing) return false;
   db.$client.transaction(() => {
      // issues.cycle_id 无 FK 引用 → 手工置 ''，不级联删 issue（同 projects 的 project_id 语义）
      db.update(issues).set({ cycleId: '' }).where(eq(issues.cycleId, id)).run();
      db.delete(cycles).where(eq(cycles.id, id)).run();
   })();
   return true;
}
