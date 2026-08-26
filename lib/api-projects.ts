import { getJson, sendJson } from '@/lib/api-client';

export const fetchProjects = async () =>
   (await getJson<{ projects: unknown[] }>('/api/projects')).projects;
export const createProject = async (input: Record<string, unknown>) =>
   (await sendJson<{ project: unknown }>('POST', '/api/projects', input)).project;
export const updateProject = async (id: string, patch: Record<string, unknown>) =>
   (await sendJson<{ project: unknown }>('PATCH', `/api/projects/${id}`, patch)).project;
export const deleteProject = async (id: string) => sendJson<void>('DELETE', `/api/projects/${id}`);
export const createProjectUpdate = async (id: string, input: Record<string, unknown>) =>
   (await sendJson<{ update: unknown }>('POST', `/api/projects/${id}/updates`, input)).update;
export const fetchProjectUpdates = async (id: string) =>
   (await getJson<{ updates: unknown[] }>(`/api/projects/${id}/updates`)).updates;
export const deleteProjectUpdate = async (id: string, updateId: string) =>
   sendJson<void>('DELETE', `/api/projects/${id}/updates/${updateId}`);
