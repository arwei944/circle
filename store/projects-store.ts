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
   createProject: (input: Record<string, unknown>) => Promise<void>;
   updateProject: (id: string, patch: Record<string, unknown>) => Promise<void>;
   deleteProject: (id: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
   projects: [],
   hydrated: false,
   hydrate: (projects) => set({ projects, hydrated: true }),
   createProject: async (input) => {
      const previous = get().projects;
      try {
         const server = (await apiCreate(input)) as LeanProjectAgg;
         set((s) => ({ projects: [...s.projects, server], hydrated: true }));
      } catch (e) {
         set({ projects: previous });
         notifyError((e as Error).message);
      }
   },
   updateProject: async (id, patch) => {
      const previous = get().projects;
      set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      try {
         const server = (await apiUpdate(id, patch)) as LeanProjectAgg;
         set((s) => ({ projects: s.projects.map((p) => (p.id === id ? server : p)) }));
      } catch (e) {
         set({ projects: previous });
         notifyError((e as Error).message);
      }
   },
   deleteProject: async (id) => {
      const previous = get().projects;
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      try {
         await apiDelete(id);
      } catch (e) {
         set({ projects: previous });
         notifyError((e as Error).message);
      }
   },
}));
