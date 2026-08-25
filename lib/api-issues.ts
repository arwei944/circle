import type { CreateIssueInput } from '@/lib/services/issues-service';

export class ApiError extends Error {
   code: string;
   details: unknown[];
   constructor(code: string, message: string, details: unknown[] = []) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.details = details;
   }
}

const ZH_FALLBACK = '操作失败，已撤销';
const CODE_MESSAGES: Record<string, string> = {
   ARG: '请求参数不合法',
   NOT_FOUND: '目标不存在',
   DOMAIN: '数据不符合要求',
   SYS: '系统错误',
};

async function parse<T>(res: Response): Promise<T> {
   if (!res.ok) {
      type ErrorBody = { code?: string; message?: string; details?: unknown[] };
      let body: ErrorBody | null = null;
      try {
         body = (await res.json()) as ErrorBody | null;
      } catch {
         body = null;
      }
      const code = body?.code ?? 'SYS';
      throw new ApiError(
         code,
         (body?.message ?? CODE_MESSAGES[code]) || ZH_FALLBACK,
         body?.details
      );
   }
   return res.json() as Promise<T>;
}

const json = (method: string, body?: unknown): RequestInit => ({
   method,
   headers: { 'Content-Type': 'application/json' },
   body: body === undefined ? undefined : JSON.stringify(body),
});

export const fetchIssues = async () =>
   (await parse<{ issues: unknown[] }>(await fetch('/api/issues', json('GET')))).issues;
export const fetchMeta = async () =>
   parse<{ labels: unknown[]; projects: unknown[]; cycles: unknown[]; users: unknown[] }>(
      await fetch('/api/meta', json('GET'))
   );
export const createIssue = async (input: CreateIssueInput) =>
   (await parse<{ issue: unknown }>(await fetch('/api/issues', json('POST', input)))).issue;
export const updateIssue = async (id: string, patch: Record<string, unknown>) =>
   (await parse<{ issue: unknown }>(await fetch(`/api/issues/${id}`, json('PATCH', patch)))).issue;
export const deleteIssue = async (id: string) =>
   parse<void>(await fetch(`/api/issues/${id}`, json('DELETE')));
