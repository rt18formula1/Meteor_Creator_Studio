"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Canvas,
  Rect,
  Circle,
  Path,
  IText,
  Group,
  type FabricObject,
  PencilBrush,
} from "fabric";
import {
  MousePointer2,
  Square,
  Circle as CircleIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalSpaceAround,
  Grid,
  Layers,
  Settings,
  Download,
  FolderOpen,
  Plus,
  Trash2,
  FolderPlus,
  Undo2,
  Redo2,
  Trash,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { useShortcutsStore, formatShortcut, type ShortcutAction } from "@/store/use-shortcuts-store";
import { useEditorStore } from "@/store/use-editor";

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 800;

type VectorTool = "select" | "rectangle" | "ellipse" | "path" | "text";

export function VectorEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<VectorTool>("select");
  const [fillColor, setFillColor] = useState("#a855f7"); // default purple
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [layers, setLayers] = useState<{ id: string; name: string; type: string }[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  // キャンバスの初期化
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      backgroundColor: "#1e1e2e", // 暗めのプレミアム背景
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;
    saveHistory();

    const onChange = () => {
      syncLayers();
      saveHistory();
    };

    canvas.on("object:added", onChange);
    canvas.on("object:removed", onChange);
    canvas.on("object:modified", onChange);

    canvas.on("selection:created", (e) => {
      const active = e.selected?.[0];
      if (active) {
        setSelectedLayerId(getObjectId(active));
        setFillColor(typeof active.fill === "string" ? active.fill : "#ffffff");
        setStrokeColor(typeof active.stroke === "string" ? active.stroke : "#ffffff");
        setStrokeWidth(active.strokeWidth || 0);
        setOpacity(active.opacity || 1);
      }
    });

    canvas.on("selection:cleared", () => {
      setSelectedLayerId(null);
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // 履歴保存
  const saveHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toObject());
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push(json);
    historyRef.current = history.slice(-30);
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    historyIndexRef.current -= 1;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      syncLayers();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    });
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    historyIndexRef.current += 1;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      syncLayers();
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, []);

  // オブジェクトにIDや名前を割り当てるためのヘルパー
  const getObjectId = (obj: any): string => {
    if (!obj.data) obj.data = {};
    if (!obj.data.id) obj.data.id = `vector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return obj.data.id;
  };

  const getObjectName = (obj: any): string => {
    if (!obj.data) obj.data = {};
    if (!obj.data.name) {
      const count = (fabricRef.current?.getObjects().filter((o) => o.type === obj.type).length || 0);
      obj.data.name = `${obj.type === "rect" ? "長方形" : obj.type === "circle" ? "楕円" : obj.type === "path" ? "パス" : "テキスト"} ${count}`;
    }
    return obj.data.name;
  };

  // レイヤー一覧の同期
  const syncLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    const list = objects.map((obj) => ({
      id: getObjectId(obj),
      name: getObjectName(obj),
      type: obj.type || "unknown",
    })).reverse();
    setLayers(list);
  }, []);

  // ツール変更
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === "path";
    if (activeTool === "path") {
      const brush = new PencilBrush(canvas);
      brush.color = fillColor;
      brush.width = strokeWidth || 2;
      canvas.freeDrawingBrush = brush;
    } else {
      canvas.selection = activeTool === "select";
      canvas.getObjects().forEach((o) => {
        o.selectable = activeTool === "select";
      });
      canvas.requestRenderAll();
    }
  }, [activeTool, fillColor, strokeWidth]);

  // キーボードショートカット
  const shortcuts = useShortcutsStore((s) => s.shortcuts);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const rawKey = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      const matched = Object.values(shortcuts).find(
        (s) =>
          s.key === rawKey &&
          s.ctrlOrMeta === ctrlOrMeta &&
          s.shift === shift &&
          s.alt === alt
      );

      if (!matched) return;
      e.preventDefault();

      if (matched.action === "undo") handleUndo();
      else if (matched.action === "redo") handleRedo();
      else if (["select", "brush", "eraser", "text", "rectangle", "ellipse"].includes(matched.action)) {
        // ベクターに適合するツールに切り替え
        if (matched.action === "select") setActiveTool("select");
        else if (matched.action === "brush") setActiveTool("path");
        else if (matched.action === "text") setActiveTool("text");
        else if (matched.action === "rectangle") setActiveTool("rectangle");
        else if (matched.action === "ellipse") setActiveTool("ellipse");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, handleUndo, handleRedo]);

  // キャンバスクリック時のオブジェクト追加
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = fabricRef.current;
    if (!canvas || activeTool === "select" || activeTool === "path") return;

    const rect = canvas.getElement().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let obj: FabricObject | null = null;

    if (activeTool === "rectangle") {
      obj = new Rect({
        left: x - 50,
        top: y - 50,
        width: 100,
        height: 100,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        opacity: opacity,
      });
    } else if (activeTool === "ellipse") {
      obj = new Circle({
        left: x - 50,
        top: y - 50,
        radius: 50,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        opacity: opacity,
      });
    } else if (activeTool === "text") {
      obj = new IText("テキスト", {
        left: x - 40,
        top: y - 15,
        fill: fillColor,
        fontSize: 32,
        opacity: opacity,
      });
    }

    if (obj) {
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      setActiveTool("select"); // 追加後は移動ツールに戻す
    }
  };

  // プロパティ変更の適用
  const updateActiveObject = (props: Record<string, any>) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.set(props);
      canvas.requestRenderAll();
      saveHistory();
    }
  };

  // 整列
  const handleAlign = (type: "left" | "center" | "right") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    // 複数選択の場合
    if (active.type === "activeSelection") {
      const selection = active as any;
      const bounds = selection.getBoundingRect();

      selection.getObjects().forEach((obj: any) => {
        if (type === "left") {
          obj.set("left", -selection.width / 2);
        } else if (type === "center") {
          obj.set("left", 0 - (obj.width * obj.scaleX) / 2);
        } else if (type === "right") {
          obj.set("left", selection.width / 2 - obj.width * obj.scaleX);
        }
        obj.setCoords();
      });
      canvas.requestRenderAll();
      saveHistory();
    }
  };

  // グループ化 / 解除
  const handleGroup = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active.type === "activeSelection") {
      (active as any).toGroup();
      canvas.requestRenderAll();
      syncLayers();
      saveHistory();
    }
  };

  const handleUngroup = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active.type === "group") {
      (active as any).toActiveSelection();
      canvas.requestRenderAll();
      syncLayers();
      saveHistory();
    }
  };

  // SVG エクスポート
  const exportSVG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const svgStr = canvas.toSVG();
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vector-design.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  // オブジェクトの削除
  const handleDelete = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      if (active.type === "activeSelection") {
        (active as any).getObjects().forEach((o: any) => canvas.remove(o));
      } else {
        canvas.remove(active);
      }
      canvas.discardActiveObject();
      canvas.renderAll();
      syncLayers();
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#11111b] text-lumina-text select-none">
      {/* メニューバー */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-lumina-border bg-[#181825] px-4 shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-purple-600 to-indigo-600 text-xs font-bold text-white">Ve</div>
            <span className="text-sm font-semibold tracking-tight">Editional Vector</span>
          </div>
          {/* 操作ボタン */}
          <div className="flex items-center gap-1.5 border-l border-lumina-border pl-6">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="rounded p-1.5 transition hover:bg-lumina-bg-hover disabled:opacity-40"
              title="元に戻す"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="rounded p-1.5 transition hover:bg-lumina-bg-hover disabled:opacity-40"
              title="やり直し"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportSVG}
            className="flex items-center gap-1.5 rounded bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-700 shadow-md"
          >
            <Download className="h-3.5 w-3.5" />
            <span>SVGエクスポート</span>
          </button>
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側ツールバー */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-lumina-border bg-[#181825] py-2">
          {[
            { id: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "選択・移動" },
            { id: "rectangle", icon: <Square className="h-4 w-4" />, label: "長方形" },
            { id: "ellipse", icon: <CircleIcon className="h-4 w-4" />, label: "楕円" },
            { id: "path", icon: <Plus className="h-4 w-4" />, label: "パス描画" },
            { id: "text", icon: <Type className="h-4 w-4" />, label: "テキスト" },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as VectorTool)}
              className={`flex h-9 w-9 items-center justify-center rounded transition ${
                activeTool === tool.id
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </aside>

        {/* キャンバスエリア */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-auto bg-[#0f0f16] p-8"
          onClick={handleCanvasClick}
        >
          <div className="border border-lumina-border/60 shadow-2xl shadow-black/80">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* 右側パネル */}
        <aside className="flex w-64 shrink-0 flex-col border-l border-lumina-border bg-[#181825]">
          {/* プロパティセクション */}
          <div className="border-b border-lumina-border p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-lumina-text-muted">オブジェクト設定</h3>

            <div className="space-y-4">
              {/* 塗り */}
              <div>
                <label className="mb-1 block text-[10px] text-lumina-text-muted">塗りつぶし色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => {
                      setFillColor(e.target.value);
                      updateActiveObject({ fill: e.target.value });
                    }}
                    className="h-8 w-12 cursor-pointer rounded border border-lumina-border bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={fillColor}
                    onChange={(e) => {
                      setFillColor(e.target.value);
                      updateActiveObject({ fill: e.target.value });
                    }}
                    className="flex-1 rounded border border-lumina-border bg-[#1e1e2e] px-2 text-xs"
                  />
                </div>
              </div>

              {/* 線 */}
              <div>
                <label className="mb-1 block text-[10px] text-lumina-text-muted">枠線</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => {
                      setStrokeColor(e.target.value);
                      updateActiveObject({ stroke: e.target.value });
                    }}
                    className="h-8 w-12 cursor-pointer rounded border border-lumina-border bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={strokeColor}
                    onChange={(e) => {
                      setStrokeColor(e.target.value);
                      updateActiveObject({ stroke: e.target.value });
                    }}
                    className="flex-1 rounded border border-lumina-border bg-[#1e1e2e] px-2 text-xs"
                  />
                </div>
              </div>

              {/* 枠線太さ */}
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-lumina-text-muted">
                  <span>枠線の太さ</span>
                  <span>{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setStrokeWidth(val);
                    updateActiveObject({ strokeWidth: val });
                  }}
                  className="w-full accent-purple-600"
                />
              </div>

              {/* 不透明度 */}
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-lumina-text-muted">
                  <span>不透明度</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setOpacity(val);
                    updateActiveObject({ opacity: val });
                  }}
                  className="w-full accent-purple-600"
                />
              </div>

              {/* グループ化と整列 */}
              <div className="border-t border-lumina-border/60 pt-4">
                <label className="mb-2 block text-[10px] text-lumina-text-muted">整列・グループ</label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAlign("left")}
                    className="flex-1 rounded border border-lumina-border bg-[#1e1e2e] py-1.5 hover:bg-lumina-bg-hover text-xs flex justify-center"
                    title="左揃え"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleAlign("center")}
                    className="flex-1 rounded border border-lumina-border bg-[#1e1e2e] py-1.5 hover:bg-lumina-bg-hover text-xs flex justify-center"
                    title="中央揃え"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleAlign("right")}
                    className="flex-1 rounded border border-lumina-border bg-[#1e1e2e] py-1.5 hover:bg-lumina-bg-hover text-xs flex justify-center"
                    title="右揃え"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={handleGroup}
                    className="flex-1 rounded border border-lumina-border bg-[#1e1e2e] py-1 text-[10px] hover:bg-lumina-bg-hover"
                  >
                    グループ化
                  </button>
                  <button
                    onClick={handleUngroup}
                    className="flex-1 rounded border border-lumina-border bg-[#1e1e2e] py-1 text-[10px] hover:bg-lumina-bg-hover"
                  >
                    解除
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* レイヤーパネルセクション */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-lumina-border px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lumina-text-muted">レイヤー</span>
              {selectedLayerId && (
                <button
                  onClick={handleDelete}
                  className="rounded p-1 text-red-400 hover:bg-red-500/10"
                  title="削除"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="lumina-scrollbar flex-1 overflow-y-auto p-2 space-y-1">
              {layers.length === 0 ? (
                <div className="py-8 text-center text-[10px] text-lumina-text-muted">レイヤーがありません</div>
              ) : (
                layers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => {
                      const canvas = fabricRef.current;
                      if (!canvas) return;
                      const target = canvas.getObjects().find((o) => getObjectId(o) === layer.id);
                      if (target) {
                        canvas.setActiveObject(target);
                        canvas.renderAll();
                        setSelectedLayerId(layer.id);
                      }
                    }}
                    className={`flex items-center justify-between rounded px-2.5 py-1.5 text-xs transition cursor-pointer ${
                      selectedLayerId === layer.id
                        ? "bg-purple-600/15 border border-purple-500/30 text-purple-200"
                        : "hover:bg-lumina-bg-hover text-lumina-text-muted hover:text-lumina-text"
                    }`}
                  >
                    <span className="truncate">{layer.name}</span>
                    <span className="text-[9px] uppercase opacity-40 font-mono">{layer.type}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
