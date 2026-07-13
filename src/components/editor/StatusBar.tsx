"use client";

import { useEditorBridge } from "@/store/use-editor-bridge";
import { useEditorStore } from "@/store/use-editor";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "@/lib/editor/document";

export function StatusBar() {
  const projectName = useEditorBridge((s) => s.projectName);
  const cursorX = useEditorBridge((s) => s.cursorX);
  const cursorY = useEditorBridge((s) => s.cursorY);
  const zoom = useEditorStore((s) => s.zoom);
  const layers = useEditorStore((s) => s.layers);
  const activeTool = useEditorStore((s) => s.activeTool);

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-lumina-border bg-lumina-toolbar px-3 text-[10px] text-lumina-text-muted">
      <div className="flex items-center gap-4">
        <span>{projectName}</span>
        <span>
          {DEFAULT_CANVAS_WIDTH} × {DEFAULT_CANVAS_HEIGHT} px
        </span>
        <span>{layers.length} レイヤー</span>
      </div>
      <div className="flex items-center gap-4">
        <span>ツール: {activeTool}</span>
        <span>
          X: {Math.round(cursorX)} Y: {Math.round(cursorY)}
        </span>
        <span>{zoom}%</span>
      </div>
    </footer>
  );
}
