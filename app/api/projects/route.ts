import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError, createProjectSchema } from '@/lib/api-contract';
import { createProject, listProjects } from '@/lib/services/projects-service';

export const runtime = 'nodejs';

export async function GET() {
   await ensureDb();
   return NextResponse.json({ projects: listProjects(getDb()) });
}

export async function POST(request: Request) {
   await ensureDb();
   const db = getDb();
   const parsed = createProjectSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(apiError('ARG', 'Invalid body'), { status: 422 });
   }
   try {
      const project = createProject(db, parsed.data);
      return NextResponse.json({ project }, { status: 201 });
   } catch (e) {
      return NextResponse.json(apiError('DOMAIN', (e as Error).message), { status: 422 });
   }
}
