import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError } from '@/lib/api-contract';
import { getTeamOverview } from '@/lib/services/teams-service';

export const runtime = 'nodejs';

export async function GET(_: Request, ctx: { params: Promise<{ teamId: string }> }) {
   await ensureDb();
   const { teamId } = await ctx.params;
   const overview = getTeamOverview(getDb(), teamId);
   if (!overview.team) {
      return NextResponse.json(apiError('NOT_FOUND', 'team not found'), { status: 404 });
   }
   return NextResponse.json(overview);
}
