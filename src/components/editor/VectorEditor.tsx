"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MousePointer2, Pen, Square, Circle, Type, Download, Undo2, Redo2, ZoomIn, ZoomOut, Trash2, Move, ArrowLeft, Sparkles, Folder } from "lucide-react";
import { AiCommandPalette } from "@/components/agent/AiCommandPalette";
import { ProjectBrowserModal } from "@/components/hub/ProjectBrowserModal";

type Vec2 = { x: number; y: number };
type PathNode = { id: string; pos: Vec2; type: "anchor" | "smooth"; cp1?: Vec2; cp2?: Vec2; };
type VShape = { id: string; name: string; type: "path" | "rect" | "ellipse" | "text"; fill: string; stroke: string; strokeWidth: number; opacity: number; nodes?: PathNode[]; closed?: boolean; x?: number; y?: number; width?: number; height?: number; rx?: number; cx?: number; cy?: number; rx2?: number; ry?: number; text?: string; fontSize?: number; fontFamily?: string; tx?: number; ty?: number; };
type VTool = "select" | "pen" | "rect" | "ellipse" | "text" | "move";

const SVG_W = 800;
const SVG_H = 600;

function genId() { return "v" + Date.now() + Math.random().toString(36).slice(2, 6); }

function pathD(nodes: PathNode[], closed: boolean): string {
  if (nodes.length === 0) return "";
  let d = "M " + nodes[0].pos.x + " " + nodes[0].pos.y;
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1]; const cur = nodes[i];
    const cp1 = prev.cp2 ? { x: prev.pos.x + prev.cp2.x, y: prev.pos.y + prev.cp2.y } : prev.pos;
    const cp2 = cur.cp1 ? { x: cur.pos.x + cur.cp1.x, y: cur.pos.y + cur.cp1.y } : cur.pos;
    d += " C " + cp1.x + " " + cp1.y + " " + cp2.x + " " + cp2.y + " " + cur.pos.x + " " + cur.pos.y;
  }
  if (closed && nodes.length > 1) { d += " Z"; }
  return d;
}

export function VectorEditor() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [shapes, setShapes] = useState<VShape[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<VTool>("select");
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState<Vec2>({ x: 0, y: 0 });
  const [penNodes, setPenNodes] = useState<PathNode[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [dragging, setDragging] = useState<{ shapeId: string; startMouse: Vec2; startPos: Vec2 } | null>(null);
  const [history, setHistory] = useState<VShape[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const isPanning = useRef(false);
  const lastPan = useRef<Vec2>({ x: 0, y: 0 });
  const [showAiPalette, setShowAiPalette] = useState(false);
  const [showProjectBrowser, setShowProjectBrowser] = useState(false);
  const selectedShape = shapes.find(s => s.id === selected) ?? null;

  const pushHistory = useCallback((next: VShape[]) => {
    setHistory(h => [...h.slice(0, histIdx + 1), next]);
    setHistIdx(i => i + 1);
    setShapes(next);
  }, [histIdx]);

  const undo = useCallback(() => {
    if (histIdx <= 0) return;
    setHistIdx(i => { setShapes(history[i - 1]); return i - 1; });
  }, [histIdx, history]);

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return;
    setHistIdx(i => { setShapes(history[i + 1]); return i + 1; });
  }, [histIdx, history]);

  const svgPoint = useCallback((e: React.MouseEvent): Vec2 => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scale = zoom / 100;
    return { x: (e.clientX - rect.left - pan.x) / scale, y: (e.clientY - rect.top - pan.y) / scale };
  }, [zoom, pan]);

  const handleSvgDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true; lastPan.current = { x: e.clientX, y: e.clientY }; return;
    }
    const pt = svgPoint(e);
    if (tool === "pen") {
      const node: PathNode = { id: genId(), pos: pt, type: "anchor", cp2: { x: 0, y: 0 } };
      if (!drawing) { setPenNodes([node]); setDrawing(true); } else { setPenNodes(prev => [...prev, node]); }
      return;
    }
    if (tool === "rect") { const s: VShape = { id: genId(), name: "矩形", type: "rect", fill: "#1473e6", stroke: "none", strokeWidth: 0, opacity: 1, x: pt.x, y: pt.y, width: 100, height: 80, rx: 0 }; pushHistory([...shapes, s]); setSelected(s.id); setTool("select"); return; }
    if (tool === "ellipse") { const s: VShape = { id: genId(), name: "楕円", type: "ellipse", fill: "#e34850", stroke: "none", strokeWidth: 0, opacity: 1, cx: pt.x, cy: pt.y, rx2: 60, ry: 40 }; pushHistory([...shapes, s]); setSelected(s.id); setTool("select"); return; }
    if (tool === "text") { const s: VShape = { id: genId(), name: "テキスト", type: "text", fill: "#000", stroke: "none", strokeWidth: 0, opacity: 1, text: "テキスト", fontSize: 32, fontFamily: "Inter", tx: pt.x, ty: pt.y }; pushHistory([...shapes, s]); setSelected(s.id); setTool("select"); return; }
  }, [tool, svgPoint, drawing, shapes, pushHistory]);

  const handleSvgMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) { const dx = e.clientX - lastPan.current.x; const dy = e.clientY - lastPan.current.y; lastPan.current = { x: e.clientX, y: e.clientY }; setPan(p => ({ x: p.x + dx, y: p.y + dy })); return; }
    if (dragging) {
      const pt = svgPoint(e); const dx = pt.x - dragging.startMouse.x; const dy = pt.y - dragging.startMouse.y;
      setShapes(prev => prev.map(s => {
        if (s.id !== dragging.shapeId) return s;
        if (s.type === "rect") return { ...s, x: dragging.startPos.x + dx, y: dragging.startPos.y + dy };
        if (s.type === "ellipse") return { ...s, cx: dragging.startPos.x + dx, cy: dragging.startPos.y + dy };
        if (s.type === "text") return { ...s, tx: dragging.startPos.x + dx, ty: dragging.startPos.y + dy };
        if (s.type === "path" && s.nodes) return { ...s, nodes: s.nodes.map(n => ({ ...n, pos: { x: n.pos.x + dx, y: n.pos.y + dy } })) };
        return s;
      }));
    }
  }, [dragging, svgPoint]);

  const handleSvgUp = useCallback(() => {
    isPanning.current = false;
    if (dragging) { pushHistory(shapes); setDragging(null); }
  }, [dragging, shapes, pushHistory]);

  const commitPen = useCallback(() => {
    if (penNodes.length < 2) { setPenNodes([]); setDrawing(false); return; }
    const s: VShape = { id: genId(), name: "パス", type: "path", fill: "none", stroke: "#1473e6", strokeWidth: 2, opacity: 1, nodes: penNodes, closed: false };
    pushHistory([...shapes, s]); setSelected(s.id); setPenNodes([]); setDrawing(false); setTool("select");
  }, [penNodes, shapes, pushHistory]);

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    pushHistory(shapes.filter(s => s.id !== selected)); setSelected(null);
  }, [selected, shapes, pushHistory]);

  const exportSvg = useCallback(() => {
    const svg = svgRef.current; if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement; clone.removeAttribute("style");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "vector.svg"; a.click(); URL.revokeObjectURL(url);
  }, []);

  const updateSelected = useCallback((patch: Partial<VShape>) => {
    setShapes(prev => prev.map(s => s.id === selected ? { ...s, ...patch } : s));
  }, [selected]);

  const runAiCommand = useCallback(async (text: string): Promise<string> => {
    const t = text.toLowerCase();
    const color =
      t.includes("赤") || t.includes("red") ? "#e34850" :
      t.includes("緑") || t.includes("green") ? "#2d9d78" :
      t.includes("黄") || t.includes("yellow") ? "#f5c518" :
      t.includes("黒") || t.includes("black") ? "#111111" :
      t.includes("白") || t.includes("white") ? "#ffffff" :
      t.includes("青") || t.includes("blue") ? "#1473e6" : "#1473e6";

    if (t.includes("削除") || t.includes("消す") || t.includes("delete")) {
      if (!selected) return "削除するオブジェクトが選択されていません。";
      const name = shapes.find(s => s.id === selected)?.name ?? "オブジェクト";
      pushHistory(shapes.filter(s => s.id !== selected));
      setSelected(null);
      return `「${name}」を削除しました。`;
    }

    if (t.includes("不透明") || t.includes("opacity")) {
      const m = text.match(/(\d+)\s*%?/);
      const opacity = m ? Math.min(1, Math.max(0, Number(m[1]) / (Number(m[1]) > 1 ? 100 : 1))) : 0.5;
      if (!selected) return "不透明度を変えるオブジェクトを選択してください。";
      pushHistory(shapes.map(s => s.id === selected ? { ...s, opacity } : s));
      return `選択中オブジェクトの不透明度を ${Math.round(opacity * 100)}% に変更しました。`;
    }

    if (t.includes("楕円") || t.includes("円") || t.includes("ellipse") || t.includes("circle")) {
      const s: VShape = { id: genId(), name: "AI楕円", type: "ellipse", fill: color, stroke: "none", strokeWidth: 0, opacity: 1, cx: 400, cy: 300, rx2: 80, ry: 60 };
      pushHistory([...shapes, s]); setSelected(s.id);
      return `${color} の楕円を追加しました。`;
    }

    if (t.includes("テキスト") || t.includes("文字") || t.includes("text")) {
      const quoted = text.match(/[「"'](.+?)[」"']/);
      const label = quoted?.[1] ?? "AIテキスト";
      const s: VShape = { id: genId(), name: "AIテキスト", type: "text", fill: color === "#ffffff" ? "#111111" : color, stroke: "none", strokeWidth: 0, opacity: 1, text: label, fontSize: 36, fontFamily: "Inter", tx: 280, ty: 300 };
      pushHistory([...shapes, s]); setSelected(s.id);
      return `テキスト「${label}」を追加しました。`;
    }

    if (t.includes("四角") || t.includes("矩形") || t.includes("rect") || t.includes("square") || t.includes("追加")) {
      const s: VShape = { id: genId(), name: "AI矩形", type: "rect", fill: color, stroke: "none", strokeWidth: 0, opacity: 1, x: 300, y: 220, width: 200, height: 140, rx: 8 };
      pushHistory([...shapes, s]); setSelected(s.id);
      return `${color} の矩形を追加しました。`;
    }

    return "解釈できませんでした。例: 「赤い四角形を追加」「テキストを追加」「不透明度を50%に」";
  }, [shapes, selected, pushHistory]);

  const scale = zoom / 100;
  const inp = "w-full rounded border border-[var(--lumina-border)] bg-[var(--lumina-bg)] px-2 py-1 text-[11px] text-[var(--lumina-text)] outline-none focus:border-[var(--lumina-accent)]";

  const TOOLS: { id: VTool; icon: React.ReactNode; label: string; key: string }[] = [
    { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "選択", key: "V" },
    { id: "move", icon: <Move className="h-4 w-4" />, label: "移動", key: "H" },
    { id: "pen", icon: <Pen className="h-4 w-4" />, label: "ペン", key: "P" },
    { id: "rect", icon: <Square className="h-4 w-4" />, label: "矩形", key: "R" },
    { id: "ellipse", icon: <Circle className="h-4 w-4" />, label: "楕円", key: "E" },
    { id: "text", icon: <Type className="h-4 w-4" />, label: "テキスト", key: "T" },
  ];

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); setShowAiPalette(prev => !prev); return; }
      if (k==="v") setTool("select"); if (k==="h") setTool("move"); if (k==="p") setTool("pen");
      if (k==="r") setTool("rect"); if (k==="e") setTool("ellipse"); if (k==="t") setTool("text");
      if (k==="enter" && tool==="pen" && drawing) commitPen();
      if (k==="escape" && drawing) { setPenNodes([]); setDrawing(false); }
      if ((k==="delete" || k==="backspace") && selected) deleteSelected();
      if ((e.metaKey || e.ctrlKey) && k==="z") { e.shiftKey ? redo() : undo(); e.preventDefault(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [tool, drawing, selected, commitPen, deleteSelected, undo, redo]);

  return (
    <div className="flex h-full flex-col bg-[var(--lumina-bg)]">
      {/* ヘッダー */}
      <div className="flex h-10 items-center justify-between border-b border-[var(--lumina-border)] bg-[var(--lumina-bg-panel)] px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--lumina-text-muted)] transition hover:bg-[var(--lumina-bg-hover)] hover:text-[var(--lumina-text)]" title="ホームに戻る"><ArrowLeft className="h-3.5 w-3.5" /><span>ホーム</span></Link>
          <span className="text-sm font-semibold text-[var(--lumina-text)] border-l border-[var(--lumina-border)] pl-3">Editional Vector</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={undo} disabled={histIdx<=0} className="rounded p-1.5 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)] disabled:opacity-40"><Undo2 className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={redo} disabled={histIdx>=history.length-1} className="rounded p-1.5 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)] disabled:opacity-40"><Redo2 className="h-3.5 w-3.5" /></button>
          <span className="mx-1 h-4 w-px bg-[var(--lumina-border)]" />
          <button type="button" onClick={() => setZoom(z => Math.max(25, z-10))} className="rounded p-1.5 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]"><ZoomOut className="h-3.5 w-3.5" /></button>
          <span className="w-12 text-center text-xs text-[var(--lumina-text-muted)]">{zoom}%</span>
          <button type="button" onClick={() => setZoom(z => Math.min(400, z+10))} className="rounded p-1.5 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]"><ZoomIn className="h-3.5 w-3.5" /></button>
          <span className="mx-1 h-4 w-px bg-[var(--lumina-border)]" />
          <button type="button" onClick={exportSvg} className="flex items-center gap-1 rounded bg-[var(--lumina-accent)] px-3 py-1 text-xs text-white hover:opacity-90"><Download className="h-3 w-3" />SVG書き出し</button>
          <span className="mx-1 h-4 w-px bg-[var(--lumina-border)]" />
          <button type="button" onClick={() => setShowAiPalette(true)} className="flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30 bg-indigo-600/15 hover:bg-indigo-600/30 transition"><Sparkles className="h-3.5 w-3.5" /><span>AI</span></button>
          <button type="button" onClick={() => setShowProjectBrowser(true)} className="flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium text-[var(--lumina-text-muted)] border border-[var(--lumina-border)] hover:bg-[var(--lumina-bg-hover)] transition"><Folder className="h-3.5 w-3.5" /><span>プロジェクト</span></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ツールバー */}
        <div className="flex w-12 flex-col items-center gap-1 border-r border-[var(--lumina-border)] bg-[var(--lumina-bg-panel)] py-2">
          {TOOLS.map(t => (
            <button key={t.id} type="button" onClick={() => { setTool(t.id); if(drawing){setPenNodes([]);setDrawing(false);} }} title={t.label+" ("+t.key+")"} className={"rounded p-2 transition "+(tool===t.id?"bg-[var(--lumina-accent)]/20 text-[var(--lumina-accent)]":"text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]")}>{t.icon}</button>
          ))}
          <span className="my-1 h-px w-8 bg-[var(--lumina-border)]" />
          <button type="button" onClick={deleteSelected} disabled={!selected} title="削除" className="rounded p-2 text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-danger)]/20 hover:text-[var(--lumina-danger)] disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
        </div>

        {/* キャンバス */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[var(--lumina-canvas-bg)]" style={{ cursor: tool==="pen"?"crosshair":tool==="move"?"grab":"default" }}>
          <svg ref={svgRef} width={SVG_W*scale} height={SVG_H*scale} viewBox={"0 0 "+SVG_W+" "+SVG_H} style={{ transform: "translate("+pan.x+"px,"+pan.y+"px)", background: "#fff", boxShadow: "0 4px 32px rgba(0,0,0,0.3)" }} onMouseDown={handleSvgDown} onMouseMove={handleSvgMove} onMouseUp={handleSvgUp}>
            {shapes.map(s => {
              const sel = s.id===selected;
              const ss = sel?{outline:"2px solid #1473e6"}:{};
              const cp = { key:s.id, opacity:s.opacity, onMouseDown:(e:React.MouseEvent)=>{ if(tool!=="select")return; e.stopPropagation(); setSelected(s.id); const pt=svgPoint(e); const sp=s.type==="rect"?{x:s.x!,y:s.y!}:s.type==="ellipse"?{x:s.cx!,y:s.cy!}:s.type==="text"?{x:s.tx!,y:s.ty!}:{x:0,y:0}; setDragging({shapeId:s.id,startMouse:pt,startPos:sp}); } };
              if(s.type==="rect") return <rect {...cp} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} style={ss}/>;
              if(s.type==="ellipse") return <ellipse {...cp} cx={s.cx} cy={s.cy} rx={s.rx2} ry={s.ry} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} style={ss}/>;
              if(s.type==="text") return <text {...cp} x={s.tx} y={s.ty} fill={s.fill} fontSize={s.fontSize} fontFamily={s.fontFamily} style={ss}>{s.text}</text>;
              if(s.type==="path"&&s.nodes) return <path {...cp} d={pathD(s.nodes,s.closed??false)} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} style={ss}/>;
              return null;
            })}
            {drawing&&penNodes.length>0&&<path d={pathD(penNodes,false)} fill="none" stroke="#1473e6" strokeWidth={1.5} strokeDasharray="4 2" pointerEvents="none" />}
            {penNodes.map(n=><circle key={n.id} cx={n.pos.x} cy={n.pos.y} r={4} fill="#fff" stroke="#1473e6" strokeWidth={1.5} pointerEvents="none" />)}
          </svg>
          {drawing&&<div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-xs text-white">クリック: ノード追加 / Enter: 確定 / Esc: キャンセル ({penNodes.length})</div>}
        </div>

        {/* プロパティ */}
        <div className="flex w-56 shrink-0 flex-col border-l border-[var(--lumina-border)] bg-[var(--lumina-bg-panel)]">
          <div className="border-b border-[var(--lumina-border)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--lumina-text-muted)]">プロパティ</div>
          {selectedShape?(
            <div className="lumina-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
              <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">名前</label>
              <input value={selectedShape.name} onChange={e=>updateSelected({name:e.target.value})} className={inp} />
              <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">塗り</label>
              <div className="flex gap-1"><input type="color" value={selectedShape.fill==="none"?"#000000":selectedShape.fill} onChange={e=>updateSelected({fill:e.target.value})} className="h-6 w-6 cursor-pointer rounded border border-[var(--lumina-border)]" /><input value={selectedShape.fill} onChange={e=>updateSelected({fill:e.target.value})} className={"flex-1 "+inp} /></div>
              <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">線</label>
              <div className="flex gap-1"><input type="color" value={selectedShape.stroke==="none"?"#000000":selectedShape.stroke} onChange={e=>updateSelected({stroke:e.target.value})} className="h-6 w-6 cursor-pointer rounded border border-[var(--lumina-border)]" /><input value={selectedShape.stroke} onChange={e=>updateSelected({stroke:e.target.value})} className={"flex-1 "+inp} /></div>
              <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">不透明度</label>
              <input type="range" min={0} max={1} step={0.01} value={selectedShape.opacity} onChange={e=>updateSelected({opacity:Number(e.target.value)})} className="w-full accent-[var(--lumina-accent)]" />
              {selectedShape.type==="rect"&&<>
                <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">幅</label><input type="number" value={selectedShape.width} onChange={e=>updateSelected({width:Number(e.target.value)})} className={inp} />
                <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">高さ</label><input type="number" value={selectedShape.height} onChange={e=>updateSelected({height:Number(e.target.value)})} className={inp} />
                <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">角丸</label><input type="number" min={0} value={selectedShape.rx} onChange={e=>updateSelected({rx:Number(e.target.value)})} className={inp} />
              </>}
              {selectedShape.type==="text"&&<>
                <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">テキスト</label><input value={selectedShape.text} onChange={e=>updateSelected({text:e.target.value})} className={inp} />
                <label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">フォントサイズ</label><input type="number" min={6} value={selectedShape.fontSize} onChange={e=>updateSelected({fontSize:Number(e.target.value)})} className={inp} />
              </>}
              {selectedShape.type==="path"&&(
                <><label className="mb-0.5 block text-[10px] text-[var(--lumina-text-muted)]">閉じる</label><input type="checkbox" checked={selectedShape.closed??false} onChange={e=>updateSelected({closed:e.target.checked})} className="accent-[var(--lumina-accent)]" /></>
              )}
            </div>
          ):(<div className="p-3 text-[11px] text-[var(--lumina-text-muted)]">シェイプを選択してください</div>)}
          {/* レイヤー */}
          <div className="border-t border-[var(--lumina-border)]">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--lumina-text-muted)]">レイヤー ({shapes.length})</div>
            <div className="lumina-scrollbar max-h-40 overflow-y-auto">
              {[...shapes].reverse().map(s=>(
                <div key={s.id} onClick={()=>setSelected(s.id)} className={"flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[11px] transition "+(selected===s.id?"bg-[var(--lumina-accent)]/15 text-[var(--lumina-text)]":"text-[var(--lumina-text-muted)] hover:bg-[var(--lumina-bg-hover)]")}><span className="text-[9px] uppercase opacity-60">{s.type}</span><span className="flex-1 truncate">{s.name}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AiCommandPalette
        appName="Editional Vector"
        isOpen={showAiPalette}
        onClose={() => setShowAiPalette(false)}
        onExecuteCommand={runAiCommand}
        suggestions={["赤い四角形を追加", "青い楕円を追加", "テキストを追加", "不透明度を 50% に変更"]}
      />
      <ProjectBrowserModal
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        defaultAppId="vector"
      />
    </div>
  );
}
