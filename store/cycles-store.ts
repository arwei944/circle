import { create } from 'zustand';
import {
   createCycle as apiCreate,
   updateCycle as apiUpdate,
   deleteCycle as apiDelete,
} from '@/lib/api-cycles';
import { notifyError } from '@/lib/toast';
import type { LeanCycle } from '@/lib/dto';

interface CyclesState {
   cycles: LeanCycle[];
   hydrated: boolean;
   hydrate: (cycles: LeanCycle[]) => void;
   createCycle: (input: Record<string, unknown>) => Promise<boolean>;
   updateCycle: (id: string, patch: Record<string, unknown>) => Promise<boolean>;
   deleteCycle: (id: string) => Promise<boolean>;
}

export const useCyclesStore = create<CyclesState>((set, get) => ({
   cycles: [],
   hydrated: false,
   hydrate: (cycles) => set({ cycles, hydrated: true }),
   createCycle: async (input) => {
      try {
         const server = (await apiCreate(input)) as LeanCycle;
         set((s) => ({
            cycles: [...s.cycles, server].sort((a, b) => a.startDate.localeCompare(b.startDate)),
            hydrated: true,
         }));
         return true;
      } catch (e) {
         notifyError((e as Error).message);
         return false;
      }
   },
   updateCycle: async (id, patch) => {
      const previous = get().cycles;
      set((s) => ({ cycles: s.cycles.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      try {
         const server = (await apiUpdate(id, patch)) as LeanCycle;
         set((s) => ({ cycles: s.cycles.map((c) => (c.id === id ? server : c)) }));
         return true;
      } catch (e) {
         set({ cycles: previous });
         notifyError((e as Error).message);
         return false;
      }
   },
   deleteCycle: async (id) => {
      const previous = get().cycles;
      set((s) => ({ cycles: s.cycles.filter((c) => c.id !== id) }));
      try {
         await apiDelete(id);
         return true;
      } catch (e) {
         set({ cycles: previous });
         notifyError((e as Error).message);
         return false;
      }
   },
}));
