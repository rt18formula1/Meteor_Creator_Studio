"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Tab = "hsb" | "rgb" | "hex";

const SWATCHES = [
  "#000000","#ffffff","#e34850","#ff6b00","#ffcc00",
  "#2d9d78","#1473e6","#7c3aed","#ff4088","#888888",
  "#cccccc","#ffeedd","#d4e8ff","#d4f4e8","#fff3cd",
];

function hexToHsb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, Math.round(s * 100), Math.round(max * 100)];
}

function hsbToHex(h: number, s: number, b: number): string {
  const sv = s / 100, bv = b / 100;
  const c = bv * sv, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = bv - c;
  let r = 0, g = 0, bl = 0;
  if (h < 60)       { r = c; g = x; bl = 0; }
  else if (h < 120) { r = x; g = c; bl = 0; }
  else if (h < 180) { r = 0; g = c; bl = x; }
  else if (h < 240) { r = 0; g = x; bl = c; }
  else if (h < 300) { r = x; g = 0; bl = c; }
  else              { r = c; g = 0; bl = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("hsb");
  const [hexInput, setHexInput] = useState(value);
  const [hsb, setHsb] = useState<[number, number, number]>(() => hexToHsb(value));
  const [rgb, setRgb] = useState<[number, number, number]>(() => hexToRgb(value));

  const sbRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSb = useRef(false);
  const draggingHue = useRef(false);

  useEffect(() => {
    setHexInput(value);
    setHsb(hexToHsb(value));
    setRgb(hexToRgb(value));
  }, [value]);

  const commit = useCallback((hex: string) => { onChange(hex); }, [onChange]);

  const updateSb = useCallback((e: React.PointerEvent) => {
    const el = sbRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const b = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    const newHsb: [number, number, number] = [hsb[0], Math.round(s * 100), Math.round(b * 100)];
    const hex = hsbToHex(...newHsb);
    setHsb(newHsb); setRgb(hexToRgb(hex)); setHexInput(hex); commit(hex);
  }, [hsb, commit]);

  const updateHue = useCallback((e: React.PointerEvent) => {
    const el = hueRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 360);
    const newHsb: [number, number, number] = [h, hsb[1], hsb[2]];
    const hex = hsbToHex(...newHsb);
    setHsb(newHsb); setRgb(hexToRgb(hex)); setHexInput(hex); commit(hex);
  }, [hsb, commit]);

  const onHexInput = (v: string) => {
    setHexInput(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setHsb(hexToHsb(v)); setRgb(hexToRgb(v)); commit(v);
    }
  };

  const sbX = hsb[1];
  const sbY = 100 - hsb[2];
  const hueX = (hsb[0] / 360) * 100;

  return (
    <div className="space-y-2">
      {/* SB pad */}
      <div
        ref={sbRef}
        className="relative h-28 w-full cursor-crosshair rounded overflow-hidden select-none"
        style={{ background: `hsl(${hsb[0]}, 100%, 50%)` }}
        onPointerDown={e => { draggingSb.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); updateSb(e); }}
        onPointerMove={e => { if (draggingSb.current) updateSb(e); }}
        onPointerUp={() => { draggingSb.current = false; }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #fff, transparent)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, #000)" }} />
        <div
          className="absolute h-3 w-3 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${sbX}% - 6px)`, top: `calc(${sbY}% - 6px)` }}
        />
      </div>

      {/* Hue rail */}
      <div
        ref={hueRef}
        className="relative h-3 w-full cursor-pointer rounded overflow-hidden select-none"
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
        onPointerDown={e => { draggingHue.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); updateHue(e); }}
        onPointerMove={e => { if (draggingHue.current) updateHue(e); }}
        onPointerUp={() => { draggingHue.current = false; }}
      >
        <div
          className="absolute top-0 h-3 w-3 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${hueX}% - 6px)` }}
        />
      </div>

      {/* Preview + hex */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded border border-lumina-border shrink-0" style={{ background: value }} />
        <input
          className="flex-1 rounded border border-lumina-border bg-lumina-bg px-2 py-1 font-mono text-[11px] text-lumina-text outline-none focus:border-lumina-accent"
          value={hexInput}
          onChange={e => onHexInput(e.target.value)}
          maxLength={7}
          spellCheck={false}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-lumina-border">
        {(["hsb", "rgb", "hex"] as Tab[]).map(t => (
          <button
            key={t} type="button" onClick={() => setTab(t)}
            className={`px-3 py-1 text-[10px] uppercase tracking-wide transition ${tab === t ? "border-b-2 border-lumina-accent text-lumina-text" : "text-lumina-text-muted hover:text-lumina-text"}`}
          >{t}</button>
        ))}
      </div>

      {tab === "hsb" && (
        <div className="grid grid-cols-3 gap-1">
          {(["H", "S", "B"] as const).map((label, i) => {
            const maxVals = [360, 100, 100];
            return (
              <div key={label} className="text-center">
                <input
                  type="number" min={0} max={maxVals[i]} value={hsb[i]}
                  onChange={e => {
                    const n = Math.max(0, Math.min(maxVals[i], Number(e.target.value)));
                    const newHsb = [...hsb] as [number, number, number];
                    newHsb[i] = n;
                    const hex = hsbToHex(...newHsb);
                    setHsb(newHsb); setRgb(hexToRgb(hex)); setHexInput(hex); commit(hex);
                  }}
                  className="w-full rounded border border-lumina-border bg-lumina-bg px-1 py-1 text-center text-[11px] text-lumina-text outline-none focus:border-lumina-accent"
                />
                <span className="text-[9px] text-lumina-text-muted">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {tab === "rgb" && (
        <div className="grid grid-cols-3 gap-1">
          {(["R", "G", "B"] as const).map((label, i) => (
            <div key={label} className="text-center">
              <input
                type="number" min={0} max={255} value={rgb[i]}
                onChange={e => {
                  const n = Math.max(0, Math.min(255, Number(e.target.value)));
                  const newRgb = [...rgb] as [number, number, number];
                  newRgb[i] = n;
                  const hex = rgbToHex(...newRgb);
                  setRgb(newRgb); setHsb(hexToHsb(hex)); setHexInput(hex); commit(hex);
                }}
                className="w-full rounded border border-lumina-border bg-lumina-bg px-1 py-1 text-center text-[11px] text-lumina-text outline-none focus:border-lumina-accent"
              />
              <span className="text-[9px] text-lumina-text-muted">{label}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "hex" && (
        <input
          className="w-full rounded border border-lumina-border bg-lumina-bg px-2 py-1.5 font-mono text-[11px] text-lumina-text outline-none focus:border-lumina-accent"
          value={hexInput} onChange={e => onHexInput(e.target.value)} maxLength={7} spellCheck={false}
        />
      )}

      {/* Swatches */}
      <div className="flex flex-wrap gap-1 pt-1">
        {SWATCHES.map(sw => (
          <button
            key={sw} type="button" title={sw}
            onClick={() => { setHexInput(sw); setHsb(hexToHsb(sw)); setRgb(hexToRgb(sw)); commit(sw); }}
            className="h-5 w-5 rounded border border-lumina-border transition hover:scale-110"
            style={{ background: sw }}
          />
        ))}
      </div>
    </div>
  );
}
