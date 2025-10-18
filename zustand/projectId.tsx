import { create } from "zustand";

type ProjectState = {
  projectId: number;
  setProjectId: (id: number) => void;
  getProjectId: () => number;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: 0,

  setProjectId: (id) => set({ projectId: id }),

  getProjectId: () => get().projectId,
}));
