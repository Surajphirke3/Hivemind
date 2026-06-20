import { create } from "zustand";
import type { AgentRole } from "@/types/database";

interface WorkspaceUiState {
  selectedAgents: AgentRole[];
  toggleAgent: (role: AgentRole) => void;
  setSelectedAgents: (roles: AgentRole[]) => void;
}

const defaultAgents: AgentRole[] = ["research", "market", "risk", "technical"];

export const useWorkspaceStore = create<WorkspaceUiState>((set) => ({
  selectedAgents: defaultAgents,
  toggleAgent: (role) =>
    set((state) => ({
      selectedAgents: state.selectedAgents.includes(role)
        ? state.selectedAgents.filter((item) => item !== role)
        : [...state.selectedAgents, role],
    })),
  setSelectedAgents: (roles) => set({ selectedAgents: roles }),
}));
