import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError, createProjectUpdateSchema } from '@/lib/api-contract';
import {
   createProjectUpdate,
   getProject,
   listProjectUpdates,
} from '@/lib/services/projects-service';

export const runtime = 'nodejs';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const db = getDb();
   const { id } = await ctx.params;
   if (!getProject(db, id)) {
      return NextResponse.json(apiError('NOT_FOUND', 'project not found'), { status: 404 });
   }
   return NextResponse.json({ updates: listProjectUpdates(db, id) });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const db = getDb();
   const { id } = await ctx.params;
   if (!getProject(db, id)) {
      return NextResponse.json(apiError('NOT_FOUND', 'project not found'), { status: 404 });
   }
   const parsed = createProjectUpdateSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(apiError('ARG', 'Invalid body'), { status: 422 });
   }
   try {
      const update = createProjectUpdate(db, id, parsed.data);
      return NextResponse.json({ update }, { status: 201 });
   } catch (e) {
      return NextResponse.json(apiError('DOMAIN', (e as Error).message), { status: 422 });
   }
}
