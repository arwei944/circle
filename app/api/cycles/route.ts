import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError, createCycleSchema } from '@/lib/api-contract';
import { createCycle, listCycles } from '@/lib/services/cycles-service';

export const runtime = 'nodejs';

export async function GET() {
   await ensureDb();
   return NextResponse.json({ cycles: listCycles(getDb()) });
}

export async function POST(request: Request) {
   await ensureDb();
   const db = getDb();
   const parsed = createCycleSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(apiError('ARG', 'Invalid body'), { status: 422 });
   }
   try {
      const cycle = createCycle(db, parsed.data);
      return NextResponse.json({ cycle }, { status: 201 });
   } catch (e) {
      return NextResponse.json(apiError('DOMAIN', (e as Error).message), { status: 422 });
   }
}
