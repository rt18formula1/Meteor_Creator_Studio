"use client";
import { useRef, useState } from "react";
import { useEditorStore } from "@/store/use-editor";
import { useEditorBridge } from "@/store/use-editor-bridge";
import { canAddLayer } from "@/lib/freemium";
import { useSubscription } from "@/store/use-subscription";
import { Eye, EyeOff, GripVertical, Lock, Plus, Trash2, Unlock } from "lucide-react";

type LayersPanelProps = {
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
};

export function LayersPanel({
  onAddLayer,
  onDeleteLayer,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
}: LayersPanelProps) {
  const layers = useEditorStore((s) => s.layers);
  const setLayers = useEditorStore((s) => s.setLayers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const tier = useSubscription((s) => s.tier);
  const handlers = useEditorBridge((s) => s.handlers);
  const canAdd = canAddLayer(tier, layers.length);

  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
    setDraggingIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    dragOver.current = idx;
    setOverIdx(idx);
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      setDraggingIdx(null);
      setOverIdx(null);
      return;
    }
    const fromId = layers[dragItem.current].id;
    const toId = layers[dragOver.current].id;

    const newLayers = [...layers];
    const [moved] = newLayers.splice(dragItem.current, 1);
    newLayers.splice(dragOver.current, 0, moved);
    setLayers(newLayers);

    // fabricキャンバス側にも反映
    handlers?.reorderLayer(fromId, toId);

    dragItem.current = null;
    dragOver.current = null;
    setDraggingIdx(null);
    setOverIdx(null);
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col border-l border-lumina-border bg-lumina-bg-panel">
      <div className="flex h-8 items-center justify-between border-b border-lumina-border px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-lumina-text-muted">
          レイヤー
        </span>
        <button
          type="button"
          onClick={onAddLayer}
          disabled={!canAdd}
          title={canAdd ? "レイヤーを追加" : "レイヤー上限に達しました"}
          className="rounded p-0.5 text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {!canAdd && (
        <div className="border-b border-lumina-border bg-lumina-pro/10 px-3 py-1.5 text-[10px] text-lumina-pro">
          無料版は5レイヤーまで。Proで無制限。
        </div>
      )}
      <div className="lumina-scrollbar flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <p className="p-3 text-[11px] text-lumina-text-muted">レイヤーがありません</p>
        ) : (
          layers.map((layer, idx) => (
            <div
              key={layer.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex cursor-pointer items-center gap-1 border-b border-lumina-border/50 px-2 py-1.5 transition select-none
                ${selectedLayerId === layer.id ? "bg-lumina-accent/15" : "hover:bg-lumina-bg-hover"}
                ${draggingIdx === idx ? "opacity-40" : ""}
                ${overIdx === idx && draggingIdx !== idx ? "border-t-2 border-t-lumina-accent" : ""}
              `}
            >
              <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-lumina-text-muted/40 active:cursor-grabbing" />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                className="rounded p-0.5 text-lumina-text-muted hover:text-lumina-text"
              >
                {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onToggleLock(layer.id); }}
                className="rounded p-0.5 text-lumina-text-muted hover:text-lumina-text"
              >
                {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </button>
              <span className="flex-1 truncate text-[11px]">{layer.name}</span>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                className="rounded p-0.5 text-lumina-text-muted hover:text-lumina-danger"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
