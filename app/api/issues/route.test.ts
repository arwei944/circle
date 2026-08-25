import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import path from 'node:path';
import { resetDbForTests } from '@/db/client';

const moduleId = path.join(process.cwd(), 'app/api/issues/route');
const idRouteModuleId = path.join(process.cwd(), 'app/api/issues/[id]/route');

let dbCounter = 0;

// Windows 上 better-sqlite3 句柄在 close 后可能延迟释放，rm 同一 db 文件会偶发 EPERM。
// 改为每个用例一个独立 db 文件（全部位于已 gitignore 的 data/ 下），无需删除，确定性最高。
const nextDbPath = () => path.join(process.cwd(), 'data', `test-api-${dbCounter++}.db`);

async function freshModule<T>(id: string): Promise<T> {
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

it('client deleteIssue resolves on 204 without body', async () => {
   const { deleteIssue: del } = await import('@/lib/api-issues');
   const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
   vi.stubGlobal('fetch', fetchMock);
   await expect(del('some-id')).resolves.toBeUndefined();
   vi.unstubAllGlobals();
});

it('DELETE returns 204 No Content for existing issue', async () => {
   const { DELETE } = await freshModule<{
      DELETE: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
   }>(idRouteModuleId);
   const { POST } = await import(moduleId);
   const created = await POST(
      new Request('http://localhost/api/issues', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ title: 'del me' }),
      })
   );
   const { issue } = (await created.json()) as { issue: { id: string } };
   const res = await DELETE(new Request('http://localhost/api/issues/xxx'), {
      params: Promise.resolve({ id: issue.id }),
   });
   expect(res.status).toBe(204);
   expect(await res.text()).toBe('');
});
