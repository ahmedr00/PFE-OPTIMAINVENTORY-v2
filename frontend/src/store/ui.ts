import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIStore = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;

  cmdkOpen: boolean;
  setCmdkOpen: (open: boolean) => void;

  aiAssistantOpen: boolean;
  setAIAssistantOpen: (open: boolean) => void;
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      cmdkOpen: false,
      setCmdkOpen: (open) => set({ cmdkOpen: open }),
      aiAssistantOpen: false,
      setAIAssistantOpen: (open) => set({ aiAssistantOpen: open }),
    }),
    {
      name: "optima.ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
