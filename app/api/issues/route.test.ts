import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { resetDbForTests } from '@/db/client';

const dbPath = path.join(process.cwd(), 'data', 'test-api.db');
const moduleId = path.join(process.cwd(), 'app/api/issues/route');

async function freshModule<T>(id: string): Promise<T> {
   resetDbForTests();
   if (existsSync(dbPath)) rmSync(dbPath);
   process.env.CIRCLE_DB_PATH = dbPath;
   return (await import(id)) as T;
}

beforeAll(() => {
   process.env.CIRCLE_DB_PATH = dbPath;
});
afterEach(async () => {
   resetDbForTests();
   vi.resetModules();
});

it('POST rejects empty title with 422 envelope', async () => {
   const { POST } = await freshModule<{ POST: (req: Request) => Promise<Response> }>(moduleId);
   const res = await POST(
      new Request('http://localhost/api/issues', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ title: '  ' }),
      })
   );
   expect(res.status).toBe(422);
   const body = (await res.json()) as { code: string };
   expect(body.code).toBe('ARG');
});

it('GET returns seeded issues after auto seed', async () => {
   const { GET } = await freshModule<{ GET: () => Promise<Response> }>(moduleId);
   const res = await GET();
   expect(res.status).toBe(200);
   const body = (await res.json()) as { issues: unknown[] };
   expect(body.issues.length).toBeGreaterThan(100);
});
