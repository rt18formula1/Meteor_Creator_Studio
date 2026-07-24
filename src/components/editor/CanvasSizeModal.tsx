"use client";
import { useState } from "react";
import { useEditorBridge } from "@/store/use-editor-bridge";
import { X } from "lucide-react";

const PRESETS = [
  { label: "FHD 1920×1080", w: 1920, h: 1080 },
  { label: "4K UHD 3840×2160", w: 3840, h: 2160 },
  { label: "正方形 1080×1080", w: 1080, h: 1080 },
  { label: "A4 (96dpi) 794×1123", w: 794, h: 1123 },
  { label: "Twitter 1200×628", w: 1200, h: 628 },
  { label: "Instagram Story 1080×1920", w: 1080, h: 1920 },
];

type Props = {
  currentWidth: number;
  currentHeight: number;
  onResize: (w: number, h: number) => void;
};

export function CanvasSizeModal({ currentWidth, currentHeight, onResize }: Props) {
  const show = useEditorBridge((s) => s.showCanvasSize);
  const setShow = useEditorBridge((s) => s.setShowCanvasSize);
  const [w, setW] = useState(currentWidth);
  const [h, setH] = useState(currentHeight);
  const [lock, setLock] = useState(false);
  const ratio = currentWidth / currentHeight;

  if (!show) return null;

  const applyPreset = (pw: number, ph: number) => { setW(pw); setH(ph); };
  const handleW = (val: number) => { setW(val); if (lock) setH(Math.round(val / ratio)); };
  const handleH = (val: number) => { setH(val); if (lock) setW(Math.round(val * ratio)); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-lumina-border bg-lumina-bg-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-lumina-text">キャンバスサイズ変更</h2>
          <button type="button" onClick={() => setShow(false)} className="text-lumina-text-muted hover:text-lumina-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-1">
          {PRESETS.map(p => (
            <button
              key={p.label} type="button"
              onClick={() => applyPreset(p.w, p.h)}
              className="rounded border border-lumina-border bg-lumina-bg-panel px-2 py-1 text-left text-[10px] text-lumina-text-muted transition hover:border-lumina-accent hover:text-lumina-text"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1">
            <label className="mb-0.5 block text-[10px] text-lumina-text-muted">幅 (px)</label>
            <input
              type="number" min={1} max={8192} value={w}
              onChange={e => handleW(Number(e.target.value))}
              className="w-full rounded border border-lumina-border bg-lumina-bg px-2 py-1.5 text-sm text-lumina-text outline-none focus:border-lumina-accent"
            />
          </div>
          <button
            type="button" onClick={() => setLock(l => !l)}
            title={lock ? "比率ロック解除" : "比率をロック"}
            className={`mt-4 rounded px-2 py-1.5 text-xs transition ${lock ? "bg-lumina-accent/20 text-lumina-accent" : "bg-lumina-bg-hover text-lumina-text-muted"}`}
          >
            {lock ? "🔒" : "🔓"}
          </button>
          <div className="flex-1">
            <label className="mb-0.5 block text-[10px] text-lumina-text-muted">高さ (px)</label>
            <input
              type="number" min={1} max={8192} value={h}
              onChange={e => handleH(Number(e.target.value))}
              className="w-full rounded border border-lumina-border bg-lumina-bg px-2 py-1.5 text-sm text-lumina-text outline-none focus:border-lumina-accent"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button" onClick={() => setShow(false)}
            className="flex-1 rounded-lg border border-lumina-border py-2 text-sm text-lumina-text-muted transition hover:bg-lumina-bg-hover"
          >キャンセル</button>
          <button
            type="button"
            onClick={() => { onResize(w, h); setShow(false); }}
            className="flex-1 rounded-lg bg-lumina-accent py-2 text-sm text-lumina-text transition hover:bg-lumina-accent-hover"
          >適用</button>
        </div>
      </div>
    </div>
  );
}
