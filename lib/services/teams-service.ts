import { eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { teams as teamsTable } from '@/db/schema';
import type { LeanCycle, LeanProjectAgg } from '@/lib/dto';
import { listCycles } from '@/lib/services/cycles-service';
import { listProjects } from '@/lib/services/projects-service';

export interface TeamOverview {
   team: {
      id: string;
      name: string;
      icon: string;
      color: string;
      joined: boolean;
   } | null;
   projects: LeanProjectAgg[];
   cycles: LeanCycle[];
}

export function getTeamOverview(db: Db, teamId: string): TeamOverview {
   const team = db.select().from(teamsTable).where(eq(teamsTable.id, teamId)).get();
   if (!team) return { team: null, projects: [], cycles: [] };
   return {
      team: {
         id: team.id,
         name: team.name,
         icon: team.icon,
         color: team.color,
         joined: team.joined === 1,
      },
      projects: listProjects(db).filter((p) => p.teamId === teamId),
      cycles: listCycles(db).filter((c) => c.teamId === teamId),
   };
}
