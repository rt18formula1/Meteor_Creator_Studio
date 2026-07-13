"use client";

import { useEditorStore } from "@/store/use-editor";
import type { ToolId } from "@/lib/types";
import {
  Circle,
  Eraser,
  MousePointer2,
  Paintbrush,
  Pipette,
  Square,
  Type,
} from "lucide-react";

const TOOLS: { id: ToolId; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "移動", shortcut: "V" },
  { id: "brush", icon: <Paintbrush className="h-4 w-4" />, label: "ブラシ", shortcut: "B" },
  { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "消しゴム", shortcut: "E" },
  { id: "text", icon: <Type className="h-4 w-4" />, label: "テキスト", shortcut: "T" },
  { id: "rectangle", icon: <Square className="h-4 w-4" />, label: "矩形", shortcut: "U" },
  { id: "ellipse", icon: <Circle className="h-4 w-4" />, label: "楕円", shortcut: "O" },
  { id: "eyedropper", icon: <Pipette className="h-4 w-4" />, label: "スポイト", shortcut: "I" },
];

export function ToolBar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);

  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-lumina-border bg-lumina-bg-panel py-2">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          title={`${tool.label} (${tool.shortcut})`}
          onClick={() => setActiveTool(tool.id)}
          className={`flex h-9 w-9 items-center justify-center rounded transition ${
            activeTool === tool.id
              ? "bg-lumina-accent/20 text-lumina-accent"
              : "text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
          }`}
        >
          {tool.icon}
        </button>
      ))}
    </aside>
  );
}
