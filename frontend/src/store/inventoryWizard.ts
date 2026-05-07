import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InventoryWizardState = {
  step: number;
  warehouseId: string;
  counterId: string;
  name: string;
  notes: string;
  technicalFileName: string | null;
  setStep: (step: number) => void;
  next: () => void;
  prev: () => void;
  set: (patch: Partial<Omit<InventoryWizardState, "set" | "next" | "prev" | "setStep" | "reset">>) => void;
  reset: () => void;
};

const initial = {
  step: 0,
  warehouseId: "",
  counterId: "",
  name: "",
  notes: "",
  technicalFileName: null,
};

export const TOTAL_STEPS = 6;

export const useInventoryWizard = create<InventoryWizardState>()(
  persist(
    (set, get) => ({
      ...initial,
      setStep: (step) => set({ step }),
      next: () => set({ step: Math.min(TOTAL_STEPS - 1, get().step + 1) }),
      prev: () => set({ step: Math.max(0, get().step - 1) }),
      set: (patch) => set(patch),
      reset: () => set(initial),
    }),
    {
      name: "optima.inventory-wizard",
      partialize: (state) => ({
        step: state.step,
        warehouseId: state.warehouseId,
        counterId: state.counterId,
        name: state.name,
        notes: state.notes,
      }),
    },
  ),
);
