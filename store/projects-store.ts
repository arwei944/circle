import { create } from 'zustand';
import {
   createProject as apiCreate,
   updateProject as apiUpdate,
   deleteProject as apiDelete,
} from '@/lib/api-projects';
import { notifyError } from '@/lib/toast';
import type { LeanProjectAgg } from '@/lib/dto';

interface ProjectsState {
   projects: LeanProjectAgg[];
   hydrated: boolean;
   hydrate: (projects: LeanProjectAgg[]) => void;
   createProject: (input: Record<string, unknown>) => Promise<boolean>;
   updateProject: (id: string, patch: Record<string, unknown>) => Promise<boolean>;
   deleteProject: (id: string) => Promise<boolean>;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
   projects: [],
   hydrated: false,
   hydrate: (projects) => set({ projects, hydrated: true }),
   createProject: async (input) => {
      try {
         const server = (await apiCreate(input)) as LeanProjectAgg;
         set((s) => ({
            projects: [...s.projects, server].sort((a, b) => a.name.localeCompare(b.name, 'zh')),
            hydrated: true,
         }));
         return true;
      } catch (e) {
         notifyError((e as Error).message);
         return false;
      }
   },
   updateProject: async (id, patch) => {
      set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      try {
         const server = (await apiUpdate(id, patch)) as LeanProjectAgg;
         set((s) => ({ projects: s.projects.map((p) => (p.id === id ? server : p)) }));
         return true;
      } catch (e) {
         notifyError((e as Error).message);
         return false;
      }
   },
   deleteProject: async (id) => {
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      try {
         await apiDelete(id);
         return true;
      } catch (e) {
         notifyError((e as Error).message);
         return false;
      }
   },
}));
