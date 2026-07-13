"use client";

import { useEditorStore } from "@/store/use-editor";
import { useSubscription } from "@/store/use-subscription";
import { PLAN_LIMITS } from "@/lib/freemium";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "@/lib/editor/document";

type PropertiesPanelProps = {
  selectedOpacity: number;
  onOpacityChange: (opacity: number) => void;
  onApplyFilter: (filter: "brightness" | "contrast" | "blur" | "grayscale") => void;
};

export function PropertiesPanel({
  selectedOpacity,
  onOpacityChange,
  onApplyFilter,
}: PropertiesPanelProps) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const brushColor = useEditorStore((s) => s.brushColor);
  const zoom = useEditorStore((s) => s.zoom);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const setBrushColor = useEditorStore((s) => s.setBrushColor);
  const setZoom = useEditorStore((s) => s.setZoom);
  const tier = useSubscription((s) => s.tier);
  const limits = PLAN_LIMITS[tier];

  return (
    <aside className="flex w-56 shrink-0 flex-col border-l border-lumina-border bg-lumina-bg-panel">
      <div className="border-b border-lumina-border px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-lumina-text-muted">
          プロパティ
        </span>
      </div>

      <div className="lumina-scrollbar flex-1 space-y-4 overflow-y-auto p-3">
        <PropertyGroup title="ドキュメント">
          <PropertyRow
            label="サイズ"
            value={`${DEFAULT_CANVAS_WIDTH} × ${DEFAULT_CANVAS_HEIGHT}`}
          />
          <PropertyRow label="ズーム" value={`${zoom}%`} />
          <input
            type="range"
            min={25}
            max={200}
            step={5}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-1 w-full accent-lumina-accent"
          />
        </PropertyGroup>

        {selectedLayerId && (
          <PropertyGroup title="選択レイヤー">
            <label className="block text-[11px] text-lumina-text-muted">
              不透明度: {Math.round(selectedOpacity * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(selectedOpacity * 100)}
              onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
              className="mt-1 w-full accent-lumina-accent"
            />
          </PropertyGroup>
        )}

        {(activeTool === "brush" || activeTool === "eraser") && (
          <PropertyGroup title={activeTool === "brush" ? "ブラシ" : "消しゴム"}>
            <label className="block text-[11px] text-lumina-text-muted">
              サイズ: {brushSize}px
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="mt-1 w-full accent-lumina-accent"
            />
            {activeTool === "brush" && (
              <>
                <label className="mt-2 block text-[11px] text-lumina-text-muted">色</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border border-lumina-border bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-lumina-text-muted">
                    {brushColor}
                  </span>
                </div>
              </>
            )}
          </PropertyGroup>
        )}

        {activeTool === "text" && (
          <PropertyGroup title="テキスト">
            <PropertyRow label="フォント" value="Inter" />
            <PropertyRow label="サイズ" value="32px" />
          </PropertyGroup>
        )}

        <PropertyGroup title="調整">
          {limits.advancedFilters ? (
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ["brightness", "明るさ"],
                  ["contrast", "コントラスト"],
                  ["blur", "ぼかし"],
                  ["grayscale", "白黒"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  disabled={!selectedLayerId}
                  onClick={() => onApplyFilter(id)}
                  className="rounded border border-lumina-border bg-lumina-bg-elevated px-2 py-1.5 text-[10px] text-lumina-text transition hover:border-lumina-accent disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded border border-lumina-border bg-lumina-bg-elevated p-2 text-[10px] text-lumina-text-muted">
              高度なフィルターは
              <span className="text-lumina-pro"> Pro限定</span>です。
            </div>
          )}
        </PropertyGroup>
      </div>
    </aside>
  );
}

function PropertyGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-lumina-text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-lumina-text-muted">{label}</span>
      <span className="text-[11px] text-lumina-text">{value}</span>
    </div>
  );
}
