import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError, updateCycleSchema } from '@/lib/api-contract';
import {
   deleteCycle,
   getCycle,
   updateCycle as updateCycleService,
} from '@/lib/services/cycles-service';
import type { UpdateCycleInput } from '@/lib/services/cycles-service';

export const runtime = 'nodejs';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const cycle = getCycle(getDb(), id);
   if (!cycle) return NextResponse.json(apiError('NOT_FOUND', 'cycle not found'), { status: 404 });
   return NextResponse.json({ cycle });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const parsed = updateCycleSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(
         { ...apiError('ARG', 'Invalid body'), details: parsed.error.issues },
         { status: 422 }
      );
   }
   try {
      const cycle = updateCycleService(getDb(), id, parsed.data as UpdateCycleInput);
      return NextResponse.json({ cycle });
   } catch (e) {
      const msg = (e as Error).message;
      if (msg.startsWith('cycle not found')) {
         return NextResponse.json(apiError('NOT_FOUND', msg), { status: 404 });
      }
      return NextResponse.json(apiError('DOMAIN', msg), { status: 422 });
   }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const ok = deleteCycle(getDb(), id);
   if (!ok) return NextResponse.json(apiError('NOT_FOUND', 'cycle not found'), { status: 404 });
   return new NextResponse(null, { status: 204 });
}
