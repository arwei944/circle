import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { createIssueSchema, apiError } from '@/lib/api-contract';
import { createIssue, listIssues } from '@/lib/services/issues-service';

export const runtime = 'nodejs';

export async function GET() {
   await ensureDb();
   return NextResponse.json({ issues: listIssues(getDb()) });
}

export async function POST(request: Request) {
   await ensureDb();
   const db = getDb();
   const parsed = createIssueSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(apiError('ARG', 'Invalid body'), { status: 422 });
   }
   try {
      const issue = createIssue(db, parsed.data);
      return NextResponse.json({ issue }, { status: 201 });
   } catch (e) {
      return NextResponse.json(apiError('DOMAIN', (e as Error).message), { status: 422 });
   }
}
