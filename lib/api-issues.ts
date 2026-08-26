import { getJson, sendJson } from '@/lib/api-client';
import type { CreateIssueInput } from '@/lib/services/issues-service';

export { ApiError } from '@/lib/api-client';

export const fetchIssues = async () => (await getJson<{ issues: unknown[] }>('/api/issues')).issues;
export const fetchMeta = async () =>
   getJson<{ labels: unknown[]; projects: unknown[]; cycles: unknown[]; users: unknown[] }>(
      '/api/meta'
   );
export const createIssue = async (input: CreateIssueInput) =>
   (await sendJson<{ issue: unknown }>('POST', '/api/issues', input)).issue;
export const updateIssue = async (id: string, patch: Record<string, unknown>) =>
   (await sendJson<{ issue: unknown }>('PATCH', `/api/issues/${id}`, patch)).issue;
export const deleteIssue = async (id: string) => sendJson<void>('DELETE', `/api/issues/${id}`);
