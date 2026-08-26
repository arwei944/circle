import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError } from '@/lib/api-contract';
import { deleteProjectUpdate } from '@/lib/services/projects-service';

export const runtime = 'nodejs';

export async function DELETE(
   _: Request,
   ctx: { params: Promise<{ id: string; updateId: string }> }
) {
   await ensureDb();
   const { id, updateId } = await ctx.params;
   const ok = deleteProjectUpdate(getDb(), id, updateId);
   if (!ok) return NextResponse.json(apiError('NOT_FOUND', 'update not found'), { status: 404 });
   return new NextResponse(null, { status: 204 });
}
