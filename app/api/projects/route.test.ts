import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import path from 'node:path';
import { resetDbForTests } from '@/db/client';

const moduleId = path.join(process.cwd(), 'app/api/projects/route');

let dbCounter = 0;

// Windows 上 better-sqlite3 句柄在 close 后可能延迟释放，rm 同一 db 文件会偶发 EPERM。
// 改为每个用例一个独立 db 文件（全部位于已 gitignore 的 data/ 下），无需删除，确定性最高。
const nextDbPath = () => path.join(process.cwd(), 'data', `test-api-projects-${dbCounter++}.db`);

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

it('POST rejects empty name with 422 ARG envelope', async () => {
   const { POST } = await freshModule<{ POST: (req: Request) => Promise<Response> }>(moduleId);
   const res = await POST(
      new Request('http://localhost/api/projects', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: '   ' }),
      })
   );
   expect(res.status).toBe(422);
   const body = (await res.json()) as { code: string };
   expect(body.code).toBe('ARG');
});

it('POST creates a project with 201 envelope', async () => {
   const { POST } = await freshModule<{ POST: (req: Request) => Promise<Response> }>(moduleId);
   const res = await POST(
      new Request('http://localhost/api/projects', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: 'New API Project' }),
      })
   );
   expect(res.status).toBe(201);
   const body = (await res.json()) as { project: { id: string; name: string } };
   expect(body.project.name).toBe('New API Project');
   expect(body.project.id).toMatch(/^proj_/);
});
