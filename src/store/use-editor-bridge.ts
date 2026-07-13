"use client";

import { create } from "zustand";

type EditorBridgeHandlers = {
  getCanvasJson: () => Promise<object>;
  loadCanvasJson: (json: object) => Promise<void>;
  getProjectName: () => string;
  saveProject: () => void;
  exportPng: () => void;
};

type EditorBridgeState = {
  handlers: EditorBridgeHandlers | null;
  projectName: string;
  cursorX: number;
  cursorY: number;
  showAgentPanel: boolean;
  showShortcuts: boolean;
  showExportModal: boolean;
  register: (handlers: EditorBridgeHandlers) => void;
  unregister: () => void;
  setProjectName: (name: string) => void;
  setCursor: (x: number, y: number) => void;
  setShowAgentPanel: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
};

export const useEditorBridge = create<EditorBridgeState>((set) => ({
  handlers: null,
  projectName: "無題のプロジェクト",
  cursorX: 0,
  cursorY: 0,
  showAgentPanel: false,
  showShortcuts: false,
  showExportModal: false,
  register: (handlers) => set({ handlers }),
  unregister: () => set({ handlers: null }),
  setProjectName: (projectName) => set({ projectName }),
  setCursor: (cursorX, cursorY) => set({ cursorX, cursorY }),
  setShowAgentPanel: (showAgentPanel) => set({ showAgentPanel }),
  setShowShortcuts: (showShortcuts) => set({ showShortcuts }),
  setShowExportModal: (showExportModal) => set({ showExportModal }),
}));
