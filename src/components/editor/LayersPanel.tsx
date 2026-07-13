"use client";

import { useEditorStore } from "@/store/use-editor";
import { Eye, EyeOff, Lock, Plus, Trash2, Unlock } from "lucide-react";
import { canAddLayer } from "@/lib/freemium";
import { useSubscription } from "@/store/use-subscription";

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
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const tier = useSubscription((s) => s.tier);
  const canAdd = canAddLayer(tier, layers.length);

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
          <p className="p-3 text-[11px] text-lumina-text-muted">
            レイヤーがありません
          </p>
        ) : (
          layers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex cursor-pointer items-center gap-1 border-b border-lumina-border/50 px-2 py-1.5 transition ${
                selectedLayerId === layer.id
                  ? "bg-lumina-accent/15"
                  : "hover:bg-lumina-bg-hover"
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className="rounded p-0.5 text-lumina-text-muted hover:text-lumina-text"
              >
                {layer.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                className="rounded p-0.5 text-lumina-text-muted hover:text-lumina-text"
              >
                {layer.locked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </button>
              <span className="flex-1 truncate text-[11px]">{layer.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLayer(layer.id);
                }}
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
