import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError, updateIssueSchema } from '@/lib/api-contract';
import {
   deleteIssue,
   getIssue,
   updateIssue as updateIssueService,
} from '@/lib/services/issues-service';
import type { UpdateIssueInput } from '@/lib/services/issues-service';

export const runtime = 'nodejs';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const issue = getIssue(getDb(), id);
   if (!issue) return NextResponse.json(apiError('NOT_FOUND', 'issue not found'), { status: 404 });
   return NextResponse.json({ issue });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const parsed = updateIssueSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(
         { ...apiError('ARG', 'Invalid body'), details: parsed.error.issues },
         { status: 422 }
      );
   }
   try {
      const issue = updateIssueService(getDb(), id, parsed.data as UpdateIssueInput);
      return NextResponse.json({ issue });
   } catch (e) {
      const msg = (e as Error).message;
      if (msg.startsWith('issue not found')) {
         return NextResponse.json(apiError('NOT_FOUND', msg), { status: 404 });
      }
      return NextResponse.json(apiError('DOMAIN', msg), { status: 422 });
   }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const ok = deleteIssue(getDb(), id);
   if (!ok) return NextResponse.json(apiError('NOT_FOUND', 'issue not found'), { status: 404 });
   return new NextResponse(null, { status: 204 });
}
