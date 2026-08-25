import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { listMeta } from '@/lib/services/meta-service';

export const runtime = 'nodejs';

export async function GET() {
   await ensureDb();
   return NextResponse.json(listMeta(getDb()));
}
