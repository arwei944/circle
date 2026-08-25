import type { Db } from '@/db/client';
import { cycles, labels, projects, users } from '@/db/schema';
import type { LeanLabel, LeanProject, LeanUser } from '@/lib/dto';

export interface LeanCycle {
   id: string;
   name: string;
   teamId: string;
   status: string;
   startDate: string;
   endDate: string;
}

export function listMeta(db: Db): {
   labels: LeanLabel[];
   projects: LeanProject[];
   cycles: LeanCycle[];
   users: LeanUser[];
} {
   const toLeanUser = (u: typeof users.$inferSelect): LeanUser => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      timezone: u.timezone,
      status: u.status,
      role: u.role,
      joinedDate: u.joinedDate,
      teamIds: u.teamIds,
   });
   const toLeanProject = (p: typeof projects.$inferSelect): LeanProject => ({
      id: p.id,
      name: p.name,
      iconIndex: p.iconIndex,
      color: p.color,
      teamId: p.teamId,
      startDate: p.startDate,
      targetDate: p.targetDate,
      percentComplete: p.percentComplete,
   });
   return {
      labels: db
         .select()
         .from(labels)
         .all()
         .map((l) => ({ id: l.id, name: l.name, color: l.color })),
      projects: db.select().from(projects).all().map(toLeanProject),
      cycles: db
         .select()
         .from(cycles)
         .all()
         .map((c) => ({
            id: c.id,
            name: c.name,
            teamId: c.teamId,
            status: c.status,
            startDate: c.startDate,
            endDate: c.endDate,
         })),
      users: db.select().from(users).all().map(toLeanUser),
   };
}
