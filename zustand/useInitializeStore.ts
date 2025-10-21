import { create } from "zustand";

interface InitializeStore {
  initializeCount: number;
  increment: () => void;
}

export const useInitializeStore = create<InitializeStore>((set) => ({
  initializeCount: 0,
  increment: () =>
    set((state) => ({ initializeCount: state.initializeCount + 1 })),
}));
