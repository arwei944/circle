import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError, updateProjectSchema } from '@/lib/api-contract';
import {
   deleteProject,
   getProject,
   updateProject as updateProjectService,
} from '@/lib/services/projects-service';
import type { UpdateProjectInput } from '@/lib/services/projects-service';

export const runtime = 'nodejs';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const project = getProject(getDb(), id);
   if (!project)
      return NextResponse.json(apiError('NOT_FOUND', 'project not found'), { status: 404 });
   return NextResponse.json({ project });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const parsed = updateProjectSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(
         { ...apiError('ARG', 'Invalid body'), details: parsed.error.issues },
         { status: 422 }
      );
   }
   try {
      const project = updateProjectService(getDb(), id, parsed.data as UpdateProjectInput);
      return NextResponse.json({ project });
   } catch (e) {
      const msg = (e as Error).message;
      if (msg.startsWith('project not found')) {
         return NextResponse.json(apiError('NOT_FOUND', msg), { status: 404 });
      }
      return NextResponse.json(apiError('DOMAIN', msg), { status: 422 });
   }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const ok = deleteProject(getDb(), id);
   if (!ok) return NextResponse.json(apiError('NOT_FOUND', 'project not found'), { status: 404 });
   return new NextResponse(null, { status: 204 });
}
