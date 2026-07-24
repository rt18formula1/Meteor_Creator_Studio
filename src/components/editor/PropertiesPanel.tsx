"use client";
import { useCallback, useEffect, useState } from "react";
import { useEditorStore } from "@/store/use-editor";
import { useEditorBridge, type SelectedObjectProps } from "@/store/use-editor-bridge";
import { useSubscription } from "@/store/use-subscription";
import { PLAN_LIMITS } from "@/lib/freemium";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "@/lib/editor/document";
import { ColorPicker } from "./ColorPicker";
import { ChevronDown, ChevronRight } from "lucide-react";

const FONTS = [
  "Inter", "Arial", "Georgia", "Times New Roman", "Courier New",
  "Verdana", "Trebuchet MS", "Noto Sans JP", "Noto Serif JP",
];

const FILTERS_LIST: { id: string; label: string; hasValue: boolean }[] = [
  { id: "brightness", label: "明るさ", hasValue: true },
  { id: "contrast", label: "コントラスト", hasValue: true },
  { id: "saturation", label: "彩度", hasValue: true },
  { id: "blur", label: "ぼかし", hasValue: true },
  { id: "grayscale", label: "白黒", hasValue: false },
  { id: "sepia", label: "セピア", hasValue: false },
  { id: "invert", label: "反転", hasValue: false },
  { id: "noise", label: "ノイズ", hasValue: true },
  { id: "pixelate", label: "ピクセル化", hasValue: true },
  { id: "sharpen", label: "シャープ", hasValue: false },
];

export function PropertiesPanel() {
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
  const handlers = useEditorBridge((s) => s.handlers);
  const selectedProps = useEditorBridge((s) => s.selectedProps);
  const setShowCanvasSize = useEditorBridge((s) => s.setShowCanvasSize);

  const [filterValues, setFilterValues] = useState<Record<string, number>>({
    brightness: 0.1, contrast: 0.1, saturation: 0.5,
    blur: 0.2, noise: 30, pixelate: 10,
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    document: true, selection: true, brush: true, text: true, fill: false, filter: true,
  });

  const toggleSection = (key: string) =>
    setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const updateProp = useCallback(<K extends keyof SelectedObjectProps>(
    key: K, value: SelectedObjectProps[K]
  ) => {
    handlers?.setObjectProps({ [key]: value });
  }, [handlers]);

  const applyFilter = useCallback((filterId: string) => {
    handlers?.applyFilter(filterId, filterValues[filterId]);
  }, [handlers, filterValues]);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-l border-lumina-border bg-lumina-bg-panel">
      <div className="border-b border-lumina-border px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-lumina-text-muted">
          プロパティ
        </span>
      </div>
      <div className="lumina-scrollbar flex-1 overflow-y-auto">

        {/* ドキュメント */}
        <Section title="ドキュメント" open={openSections.document} onToggle={() => toggleSection("document")}>
          <div className="space-y-1.5">
            <Row label="サイズ" value={`${DEFAULT_CANVAS_WIDTH} × ${DEFAULT_CANVAS_HEIGHT}`} />
            <Row label="ズーム" value={`${zoom}%`} />
            <input type="range" min={25} max={400} step={5} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="mt-1 w-full accent-lumina-accent" />
            <button
              type="button"
              onClick={() => setShowCanvasSize(true)}
              className="w-full rounded border border-lumina-border bg-lumina-bg-elevated px-2 py-1 text-[11px] text-lumina-text-muted transition hover:border-lumina-accent hover:text-lumina-text"
            >
              キャンバスサイズを変更...
            </button>
          </div>
        </Section>

        {/* ブラシ/消しゴム */}
        {(activeTool === "brush" || activeTool === "eraser") && (
          <Section title={activeTool === "brush" ? "ブラシ" : "消しゴム"} open={openSections.brush} onToggle={() => toggleSection("brush")}>
            <label className="block text-[11px] text-lumina-text-muted">サイズ: {brushSize}px</label>
            <input type="range" min={1} max={200} value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="mt-1 w-full accent-lumina-accent" />
            {activeTool === "brush" && (
              <>
                <label className="mt-2 block text-[11px] text-lumina-text-muted">色</label>
                <div className="mt-1">
                  <ColorPicker value={brushColor} onChange={setBrushColor} />
                </div>
              </>
            )}
          </Section>
        )}

        {/* 選択オブジェクト */}
        {selectedLayerId && selectedProps && (
          <>
            {/* 不透明度 */}
            <Section title="選択レイヤー" open={openSections.selection} onToggle={() => toggleSection("selection")}>
              <label className="block text-[11px] text-lumina-text-muted">
                不透明度: {Math.round(selectedProps.opacity * 100)}%
              </label>
              <input type="range" min={0} max={100}
                value={Math.round(selectedProps.opacity * 100)}
                onChange={e => updateProp("opacity", Number(e.target.value) / 100)}
                className="mt-1 w-full accent-lumina-accent" />

              {selectedProps.stroke !== undefined && (
                <div className="mt-2 space-y-1">
                  <label className="block text-[11px] text-lumina-text-muted">線幅: {selectedProps.strokeWidth}px</label>
                  <input type="range" min={0} max={20}
                    value={selectedProps.strokeWidth}
                    onChange={e => updateProp("strokeWidth", Number(e.target.value))}
                    className="w-full accent-lumina-accent" />
                </div>
              )}
            </Section>

            {/* 塗り・線色 */}
            <Section title="カラー" open={openSections.fill} onToggle={() => toggleSection("fill")}>
              <label className="mb-1 block text-[11px] text-lumina-text-muted">塗り</label>
              <ColorPicker value={selectedProps.fill || "#000000"} onChange={v => updateProp("fill", v)} />
              {selectedProps.stroke !== undefined && (
                <>
                  <label className="mb-1 mt-2 block text-[11px] text-lumina-text-muted">線</label>
                  <ColorPicker value={selectedProps.stroke || "#000000"} onChange={v => updateProp("stroke", v)} />
                </>
              )}
            </Section>

            {/* テキスト */}
            {selectedProps.type === "IText" || selectedProps.type === "Textbox" ? (
              <Section title="テキスト" open={openSections.text} onToggle={() => toggleSection("text")}>
                <div className="space-y-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] text-lumina-text-muted">フォント</label>
                    <select
                      value={selectedProps.fontFamily || "Inter"}
                      onChange={e => updateProp("fontFamily", e.target.value)}
                      className="w-full rounded border border-lumina-border bg-lumina-bg px-2 py-1 text-[11px] text-lumina-text outline-none focus:border-lumina-accent"
                    >
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1">
                      <label className="mb-0.5 block text-[10px] text-lumina-text-muted">サイズ</label>
                      <input type="number" min={6} max={500}
                        value={selectedProps.fontSize || 32}
                        onChange={e => updateProp("fontSize", Number(e.target.value))}
                        className="w-full rounded border border-lumina-border bg-lumina-bg px-2 py-1 text-[11px] text-lumina-text outline-none focus:border-lumina-accent"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-0.5 block text-[10px] text-lumina-text-muted">配置</label>
                      <select
                        value={selectedProps.textAlign || "left"}
                        onChange={e => updateProp("textAlign", e.target.value)}
                        className="w-full rounded border border-lumina-border bg-lumina-bg px-2 py-1 text-[11px] text-lumina-text outline-none focus:border-lumina-accent"
                      >
                        <option value="left">左</option>
                        <option value="center">中央</option>
                        <option value="right">右</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[
                      { label: "B", key: "fontWeight" as const, on: "bold", off: "normal" },
                      { label: "I", key: "fontStyle" as const, on: "italic", off: "normal" },
                    ].map(({ label, key, on, off }) => (
                      <button key={label} type="button"
                        onClick={() => updateProp(key, selectedProps[key] === on ? off : on)}
                        className={`flex-1 rounded border py-1 text-xs font-semibold transition ${
                          selectedProps[key] === on
                            ? "border-lumina-accent bg-lumina-accent/20 text-lumina-accent"
                            : "border-lumina-border text-lumina-text-muted hover:border-lumina-accent"
                        }`}
                      >{label}</button>
                    ))}
                    <button type="button"
                      onClick={() => updateProp("underline", !selectedProps.underline)}
                      className={`flex-1 rounded border py-1 text-xs underline transition ${
                        selectedProps.underline
                          ? "border-lumina-accent bg-lumina-accent/20 text-lumina-accent"
                          : "border-lumina-border text-lumina-text-muted hover:border-lumina-accent"
                      }`}
                    >U</button>
                  </div>
                  <label className="mb-0.5 block text-[10px] text-lumina-text-muted">テキスト色</label>
                  <ColorPicker value={selectedProps.fill || "#000000"} onChange={v => updateProp("fill", v)} />
                </div>
              </Section>
            ) : null}

            {/* フィルター */}
            <Section title="フィルター" open={openSections.filter} onToggle={() => toggleSection("filter")}>
              {limits.advancedFilters ? (
                <div className="space-y-1">
                  {FILTERS_LIST.map(f => (
                    <div key={f.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => applyFilter(f.id)}
                        className="w-20 shrink-0 rounded border border-lumina-border bg-lumina-bg-elevated px-2 py-1 text-[10px] text-lumina-text transition hover:border-lumina-accent"
                      >
                        {f.label}
                      </button>
                      {f.hasValue && (
                        <input
                          type="range" min={0}
                          max={f.id === "noise" ? 100 : f.id === "pixelate" ? 50 : f.id === "blur" ? 1 : 1}
                          step={f.id === "noise" || f.id === "pixelate" ? 1 : 0.05}
                          value={filterValues[f.id] ?? 0.1}
                          onChange={e => setFilterValues(prev => ({ ...prev, [f.id]: Number(e.target.value) }))}
                          className="flex-1 accent-lumina-accent"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded border border-lumina-border bg-lumina-bg-elevated p-2 text-[10px] text-lumina-text-muted">
                  高度なフィルターは<span className="text-lumina-pro"> Pro限定</span>です。
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}

function Section({
  title, open, onToggle, children,
}: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-lumina-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-lumina-text-muted hover:text-lumina-text"
      >
        {title}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-lumina-text-muted">{label}</span>
      <span className="text-[11px] text-lumina-text">{value}</span>
    </div>
  );
}
