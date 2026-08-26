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
   createCycle: (input: Record<string, unknown>) => Promise<void>;
   updateCycle: (id: string, patch: Record<string, unknown>) => Promise<void>;
   deleteCycle: (id: string) => Promise<void>;
}

export const useCyclesStore = create<CyclesState>((set, get) => ({
   cycles: [],
   hydrated: false,
   hydrate: (cycles) => set({ cycles, hydrated: true }),
   createCycle: async (input) => {
      const previous = get().cycles;
      try {
         const server = (await apiCreate(input)) as LeanCycle;
         set((s) => ({ cycles: [...s.cycles, server], hydrated: true }));
      } catch (e) {
         set({ cycles: previous });
         notifyError((e as Error).message);
      }
   },
   updateCycle: async (id, patch) => {
      const previous = get().cycles;
      set((s) => ({ cycles: s.cycles.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      try {
         const server = (await apiUpdate(id, patch)) as LeanCycle;
         set((s) => ({ cycles: s.cycles.map((c) => (c.id === id ? server : c)) }));
      } catch (e) {
         set({ cycles: previous });
         notifyError((e as Error).message);
      }
   },
   deleteCycle: async (id) => {
      const previous = get().cycles;
      set((s) => ({ cycles: s.cycles.filter((c) => c.id !== id) }));
      try {
         await apiDelete(id);
      } catch (e) {
         set({ cycles: previous });
         notifyError((e as Error).message);
      }
   },
}));
