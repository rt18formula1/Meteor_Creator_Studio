"use client";

import { create } from "zustand";
import type { ToolId } from "@/lib/types";

export type LayerInfo = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
};

type EditorState = {
  activeTool: ToolId;
  brushSize: number;
  brushColor: string;
  layers: LayerInfo[];
  selectedLayerId: string | null;
  zoom: number;
  setActiveTool: (tool: ToolId) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setLayers: (layers: LayerInfo[]) => void;
  addLayer: (layer: LayerInfo) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<LayerInfo>) => void;
  setSelectedLayerId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: "select",
  brushSize: 8,
  brushColor: "#ffffff",
  layers: [],
  selectedLayerId: null,
  zoom: 100,
  setActiveTool: (activeTool) => set({ activeTool }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setLayers: (layers) => set({ layers }),
  addLayer: (layer) =>
    set((s) => ({ layers: [layer, ...s.layers] })),
  removeLayer: (id) =>
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
    })),
  updateLayer: (id, patch) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),
  setSelectedLayerId: (selectedLayerId) => set({ selectedLayerId }),
  setZoom: (zoom) => set({ zoom }),
}));
