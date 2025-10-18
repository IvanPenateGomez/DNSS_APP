// stores/useRefreshDB.ts
import { create } from 'zustand';

interface refreshDbStore {
  refreshDB: number;
  increment: () => void;
}

export const useRefreshDbStore = create<refreshDbStore>((set) => ({
  refreshDB: 0,
  increment: () => set((state) => ({ refreshDB: state.refreshDB + 1 })),
}));
