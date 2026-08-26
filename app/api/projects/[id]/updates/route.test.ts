import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import path from 'node:path';
import { resetDbForTests } from '@/db/client';

const projectsRoute = path.join(process.cwd(), 'app/api/projects/route');
const updatesRoute = path.join(process.cwd(), 'app/api/projects/[id]/updates/route');

let dbCounter = 0;

// Windows: better-sqlite3 句柄 close 后释放可能延迟，每个用例用独立 db 文件。
const nextDbPath = () => path.join(process.cwd(), 'data', `test-api-updates-${dbCounter++}.db`);

async function freshImport<T>(id: string): Promise<T> {
   resetDbForTests();
   process.env.CIRCLE_DB_PATH = nextDbPath();
   return (await import(id)) as T;
}

beforeAll(() => {
   process.env.CIRCLE_DB_PATH = nextDbPath();
});
afterEach(async () => {
   resetDbForTests();
   vi.resetModules();
});

it('GET returns the persisted updates envelope (empty for a new project)', async () => {
   // One shared db for both route modules in the same test.
   resetDbForTests();
   process.env.CIRCLE_DB_PATH = nextDbPath();
   const { POST } = await import(projectsRoute);
   const { GET } = await import(updatesRoute);
   const created = await POST(
      new Request('http://localhost/api/projects', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: 'UPD Gains' }),
      })
   );
   expect(created.status).toBe(201);
   const { project } = (await created.json()) as { project: { id: string } };

   const res = await GET(new Request('http://localhost/api/projects/x/updates'), {
      params: Promise.resolve({ id: project.id }),
   });
   expect(res.status).toBe(200);
   const body = (await res.json()) as { updates: unknown[] };
   expect(Array.isArray(body.updates)).toBe(true);
   expect(body.updates).toHaveLength(0);
});

it('GET returns 404 for an unknown project id', async () => {
   const { GET } = await freshImport<{
      GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
   }>(updatesRoute);
   const res = await GET(new Request('http://localhost/api/projects/x/updates'), {
      params: Promise.resolve({ id: 'does-not-exist' }),
   });
   expect(res.status).toBe(404);
});
