"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Canvas,
  Circle,
  IText,
  PencilBrush,
  Rect,
  FabricImage,
  type FabricObject,
} from "fabric";
import { EditorMenuBar } from "./EditorMenuBar";
import { ToolBar } from "./ToolBar";
import { LayersPanel } from "./LayersPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";
import { ExportModal } from "./ExportModal";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { CanvasSizeModal } from "./CanvasSizeModal";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { AiCommandPalette } from "@/components/agent/AiCommandPalette";
import { ProjectBrowserModal } from "@/components/hub/ProjectBrowserModal";
import { useEditorStore } from "@/store/use-editor";
import { useEditorBridge } from "@/store/use-editor-bridge";
import { useSubscription } from "@/store/use-subscription";
import { useShortcutsStore } from "@/store/use-shortcuts-store";
import { PLAN_LIMITS, canAddLayer } from "@/lib/freemium";
import {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  type MeteorProject,
  createProject,
} from "@/lib/editor/document";
import { downloadProject, saveRecentProject } from "@/lib/editor/recent-projects";
import { executeCommands } from "@/lib/editor/command-engine";
import type { CanvasDocument } from "@/lib/editor/document";

export function PhotoEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const layerCounter = useRef(0);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [selectedOpacity, setSelectedOpacity] = useState(1);
  const [showAiPalette, setShowAiPalette] = useState(false);
  const [showProjectBrowser, setShowProjectBrowser] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const tier = useSubscription((s) => s.tier);
  const activeTool = useEditorStore((s) => s.activeTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const brushColor = useEditorStore((s) => s.brushColor);
  const zoom = useEditorStore((s) => s.zoom);
  const setLayers = useEditorStore((s) => s.setLayers);
  const addLayer = useEditorStore((s) => s.addLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const setSelectedLayerId = useEditorStore((s) => s.setSelectedLayerId);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const setBrushColor = useEditorStore((s) => s.setBrushColor);
  const layers = useEditorStore((s) => s.layers);

  const projectName = useEditorBridge((s) => s.projectName);
  const setProjectName = useEditorBridge((s) => s.setProjectName);
  const setCursor = useEditorBridge((s) => s.setCursor);
  const showAgentPanel = useEditorBridge((s) => s.showAgentPanel);
  const handlers = useEditorBridge((s) => s.handlers);
  const register = useEditorBridge((s) => s.register);
  const unregister = useEditorBridge((s) => s.unregister);
  const setShowExportModal = useEditorBridge((s) => s.setShowExportModal);
  const setSelectedProps = useEditorBridge((s) => s.setSelectedProps);

  const syncLayersFromCanvas = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const layerInfos = objects
      .map((obj, i) => {
        const id = (obj.get("data") as { layerId?: string })?.layerId ?? `layer-${i}`;
        return {
          id,
          name: (obj.get("data") as { layerName?: string })?.layerName ?? `レイヤー ${i + 1}`,
          visible: obj.visible !== false,
          locked: !obj.selectable,
        };
      })
      .reverse();

    setLayers(layerInfos);
  }, [setLayers]);

  const saveHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toObject(["data"]));
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push(json);
    historyRef.current = history.slice(-30);
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const assignLayerMeta = useCallback((obj: FabricObject, name?: string) => {
    layerCounter.current += 1;
    const layerId = `layer-${Date.now()}-${layerCounter.current}`;
    const layerName = name ?? `レイヤー ${layerCounter.current}`;
    obj.set("data", { layerId, layerName });
    return { layerId, layerName };
  }, []);

  const loadCanvasFromJson = useCallback(
    async (json: object) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      await canvas.loadFromJSON(json);
      canvas.renderAll();
      syncLayersFromCanvas();
      saveHistory();
    },
    [saveHistory, syncLayersFromCanvas],
  );

  const getCanvasJson = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return {};
    return canvas.toObject(["data"]);
  }, []);

  const handleSaveProject = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const project: MeteorProject = {
      ...createProject(projectName),
      canvas: canvas.toObject(["data"]) as MeteorProject["canvas"],
      updatedAt: new Date().toISOString(),
    };
    downloadProject(project);
    saveRecentProject(project);
  }, [projectName]);

  useEffect(() => {
    register({
      getCanvasJson,
      loadCanvasJson: loadCanvasFromJson,
      getProjectName: () => projectName,
      saveProject: handleSaveProject,
      exportPng: () => setShowExportModal(true),
      reorderLayer: (fromId, toId) => {
        const canvas = fabricRef.current; if (!canvas) return;
        const objs = canvas.getObjects();
        const fObj = objs.find(o => o.get("data")?.layerId === fromId);
        const tObj = objs.find(o => o.get("data")?.layerId === toId);
        if (!fObj || !tObj) return;
        canvas.remove(fObj); canvas.insertAt(objs.indexOf(tObj), fObj);
        canvas.renderAll(); saveHistory();
      },
      getSelectedObjectProps: async () => {
        const canvas = fabricRef.current; if (!canvas) return null;
        const obj = canvas.getActiveObject(); if (!obj) return null;
        return { type: obj.type ?? "unknown", fill: String(obj.get("fill") || "#000000"), stroke: String(obj.get("stroke") || "#000000"), strokeWidth: Number(obj.get("strokeWidth") || 0), opacity: typeof obj.opacity === "number" ? obj.opacity : 1 };
      },
      setObjectProps: (props) => {
        const canvas = fabricRef.current; if (!canvas) return;
        const obj = canvas.getActiveObject(); if (!obj) return;
        obj.set(props); canvas.renderAll(); saveHistory();
      },
      applyFilter: async (filterId, value) => {
        const canvas = fabricRef.current; if (!canvas) return;
        const obj = canvas.getActiveObject(); if (!obj || !("filters" in obj)) return;
        const fabricImg = obj;
        const fab = await import("fabric");
        const f = fab.filters;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mp: Record<string, () => any> = {
          brightness:()=>new f.Brightness({brightness:value??0.1}),
          contrast:()=>new f.Contrast({contrast:value??0.1}),
          saturation:()=>new f.Saturation({saturation:value??0.5}),
          blur:()=>new f.Blur({blur:value??0.2}),
          grayscale:()=>new f.Grayscale(),sepia:()=>new f.Sepia(),invert:()=>new f.Invert(),
          noise:()=>new f.Noise({noise:value??30}),
          pixelate:()=>new f.Pixelate({blocksize:value??10}),
          sharpen:()=>new f.Convolute({matrix:[0,-1,0,-1,5,-1,0,-1,0]}),
        };
        const fn=mp[filterId]; if(!fn)return;
        (fabricImg as import("fabric").FabricImage).filters=[fn()]; (fabricImg as import("fabric").FabricImage).applyFilters(); canvas.renderAll(); saveHistory();
      },
    });
    return () => unregister();
  }, [
    register,
    unregister,
    getCanvasJson,
    loadCanvasFromJson,
    projectName,
    handleSaveProject,
    setShowExportModal,
    saveHistory,
    setSelectedProps,
  ]);

  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    const bgRect = new Rect({
      left: 0,
      top: 0,
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      fill: "#ffffff",
      selectable: false,
      evented: false,
    });
    const bgMeta = assignLayerMeta(bgRect, "背景");
    canvas.add(bgRect);
    addLayer({ id: bgMeta.layerId, name: "背景", visible: true, locked: true });
    saveHistory();

    const onChange = () => {
      syncLayersFromCanvas();
      saveHistory();
    };

    canvas.on("object:added", onChange);
    canvas.on("object:removed", onChange);
    canvas.on("object:modified", onChange);

    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        const id = (obj.get("data") as { layerId?: string })?.layerId;
        if (id) setSelectedLayerId(id);
        setSelectedOpacity(typeof obj.opacity === "number" ? obj.opacity : 1);
      }
    });
    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        const id = (obj.get("data") as { layerId?: string })?.layerId;
        if (id) setSelectedLayerId(id);
        setSelectedOpacity(typeof obj.opacity === "number" ? obj.opacity : 1);
      }
    });
    canvas.on("selection:cleared", () => { setSelectedLayerId(null); setSelectedProps(null); });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [addLayer, assignLayerMeta, saveHistory, setSelectedLayerId, syncLayersFromCanvas]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === "brush" || activeTool === "eraser";

    if (activeTool === "brush") {
      const brush = new PencilBrush(canvas);
      brush.color = brushColor;
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "eraser") {
      const brush = new PencilBrush(canvas);
      brush.color = "#ffffff";
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;
    } else {
      canvas.selection = activeTool === "select";
    }
  }, [activeTool, brushColor, brushSize]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const container = canvas.getElement().parentElement;
    if (!container) return;
    const scale = zoom / 100;
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = "center center";
  }, [zoom]);

  // 新しいショートカット処理はコンポーネント下部に配置されます


  const sampleColorAt = useCallback(
    (x: number, y: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext();
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = `#${[pixel[0], pixel[1], pixel[2]]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")}`;
      setBrushColor(hex);
    },
    [setBrushColor],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const rect = canvas.getElement().getBoundingClientRect();
      const scale = zoom / 100;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      setCursor(x, y);

      if (activeTool === "eyedropper") {
        sampleColorAt(x, y);
        useEditorStore.getState().setActiveTool("brush");
        return;
      }

      if (activeTool === "select" || activeTool === "brush" || activeTool === "eraser") return;

      if (!canAddLayer(tier, layers.length)) {
        alert("レイヤー上限に達しました。Proプランで無制限に利用できます。");
        return;
      }

      if (activeTool === "text") {
        const text = new IText("テキストを入力", {
          left: x,
          top: y,
          fontSize: 32,
          fill: brushColor,
          fontFamily: "Inter, sans-serif",
        });
        assignLayerMeta(text, "テキスト");
        canvas.add(text);
        canvas.setActiveObject(text);
      } else if (activeTool === "rectangle") {
        const rectObj = new Rect({
          left: x - 50,
          top: y - 50,
          width: 100,
          height: 100,
          fill: brushColor,
        });
        assignLayerMeta(rectObj, "矩形");
        canvas.add(rectObj);
        canvas.setActiveObject(rectObj);
      } else if (activeTool === "ellipse") {
        const circle = new Circle({
          left: x - 50,
          top: y - 50,
          radius: 50,
          fill: brushColor,
        });
        assignLayerMeta(circle, "楕円");
        canvas.add(circle);
        canvas.setActiveObject(circle);
      }

      canvas.renderAll();
    },
    [activeTool, assignLayerMeta, brushColor, layers.length, sampleColorAt, setCursor, tier, zoom],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const rect = canvas.getElement().getBoundingClientRect();
      const scale = zoom / 100;
      setCursor((e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
    },
    [setCursor, zoom],
  );

  const handleNew = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    const bgRect = new Rect({
      left: 0,
      top: 0,
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      fill: "#ffffff",
      selectable: false,
      evented: false,
    });
    const bgMeta = assignLayerMeta(bgRect, "背景");
    canvas.add(bgRect);
    setLayers([{ id: bgMeta.layerId, name: "背景", visible: true, locked: true }]);
    setProjectName("無題のプロジェクト");
    saveHistory();
    canvas.renderAll();
  }, [assignLayerMeta, saveHistory, setLayers, setProjectName]);

  const handleExport = useCallback(
    (format: "png" | "jpeg" = "png", quality = 0.92) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const limits = PLAN_LIMITS[tier];
      const dataUrl = canvas.toDataURL({
        format: format === "jpeg" ? "jpeg" : "png",
        quality,
        multiplier: 1,
      });

      const download = (href: string) => {
        const link = document.createElement("a");
        link.download = `meteor-export.${format}`;
        link.href = href;
        link.click();
      };

      if (limits.watermarkOnExport) {
        const img = new Image();
        img.onload = () => {
          const exportCanvas = document.createElement("canvas");
          exportCanvas.width = DEFAULT_CANVAS_WIDTH;
          exportCanvas.height = DEFAULT_CANVAS_HEIGHT;
          const ctx = exportCanvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          ctx.font = "24px Inter, sans-serif";
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.textAlign = "right";
          ctx.fillText("Meteor Photo（無料版）", DEFAULT_CANVAS_WIDTH - 20, DEFAULT_CANVAS_HEIGHT - 20);
          download(exportCanvas.toDataURL("image/png"));
        };
        img.src = dataUrl;
      } else {
        download(dataUrl);
      }
    },
    [tier],
  );

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    historyIndexRef.current -= 1;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      syncLayersFromCanvas();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, [syncLayersFromCanvas]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    historyIndexRef.current += 1;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      syncLayersFromCanvas();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, [syncLayersFromCanvas]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (!canAddLayer(tier, layers.length)) {
        alert("レイヤー上限に達しました。");
        return;
      }
      const url = URL.createObjectURL(file);
      try {
        const img = await FabricImage.fromURL(url);
        const scale = Math.min(
          DEFAULT_CANVAS_WIDTH / (img.width ?? 1),
          DEFAULT_CANVAS_HEIGHT / (img.height ?? 1),
          1,
        );
        img.scale(scale);
        img.set({
          left: (DEFAULT_CANVAS_WIDTH - (img.width ?? 0) * scale) / 2,
          top: (DEFAULT_CANVAS_HEIGHT - (img.height ?? 0) * scale) / 2,
        });
        assignLayerMeta(img, file.name);
        canvas.add(img);
        canvas.renderAll();
      } finally {
        URL.revokeObjectURL(url);
        e.target.value = "";
      }
    },
    [assignLayerMeta, layers.length, tier],
  );

  const handleProjectChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project = JSON.parse(text) as MeteorProject;
        if (project.format !== "meteor-project") throw new Error("Invalid format");
        setProjectName(project.name);
        await loadCanvasFromJson(project.canvas);
        saveRecentProject(project);
      } catch {
        alert("プロジェクトファイルを読み込めませんでした。");
      } finally {
        e.target.value = "";
      }
    },
    [loadCanvasFromJson, setProjectName],
  );

  const handleOpacityChange = useCallback(
    (opacity: number) => {
      const canvas = fabricRef.current;
      if (!canvas || !selectedLayerId) return;
      const obj = canvas.getObjects().find(
        (o) => (o.get("data") as { layerId?: string })?.layerId === selectedLayerId,
      );
      if (obj) {
        obj.set("opacity", opacity);
        setSelectedOpacity(opacity);
        canvas.renderAll();
        saveHistory();
      }
    },
    [saveHistory, selectedLayerId],
  );

  const handleApplyFilter = useCallback(
    async (filter: "brightness" | "contrast" | "blur" | "grayscale") => {
      const canvas = fabricRef.current;
      if (!canvas || !selectedLayerId) return;
      const current = canvas.toObject(["data"]) as CanvasDocument;
      const { canvas: next } = executeCommands(current, [
        { type: "apply_filter", layerId: selectedLayerId, filter },
      ]);
      await loadCanvasFromJson(next);
    },
    [loadCanvasFromJson, selectedLayerId],
  );

  // ショートカット設定をストアから取得
  const shortcuts = useShortcutsStore((s) => s.shortcuts);

  const runAiCommand = useCallback(
    async (prompt: string): Promise<string> => {
      if (!handlers) return "キャンバスがまだ準備できていません。";
      const canvas = await handlers.getCanvasJson();
      const res = await fetch("/api/v1/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, canvas, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "API error");
      await handlers.loadCanvasJson(data.canvas);
      const msgs = (data.results as { message: string }[] | undefined)
        ?.map((r) => r.message)
        .join(" / ");
      return msgs || "コマンドを実行しました。";
    },
    [handlers, tier],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowAiPalette((v) => !v);
        return;
      }

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
      e.stopPropagation();

      switch (matched.action) {
        case "select":
        case "brush":
        case "eraser":
        case "text":
        case "rectangle":
        case "ellipse":
        case "eyedropper":
          useEditorStore.getState().setActiveTool(matched.action as typeof activeTool);
          break;
        case "undo":
          handleUndo();
          break;
        case "redo":
          handleRedo();
          break;
        case "save":
          handleSaveProject();
          break;
        case "export":
          setShowExportModal(true);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveProject, setShowExportModal, shortcuts, activeTool, handleUndo, handleRedo]);

  return (
    <div className="flex h-full flex-col">
      <EditorMenuBar
        onNew={handleNew}
        onOpen={() => fileInputRef.current?.click()}
        onOpenProject={() => projectInputRef.current?.click()}
        onSave={handleSaveProject}
        onExport={() => setShowExportModal(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenAiPalette={() => setShowAiPalette(true)}
        onOpenCloudProjects={() => setShowProjectBrowser(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <ToolBar />
        <div
          className="relative flex flex-1 items-center justify-center overflow-auto bg-lumina-canvas-bg"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
        >
          <div className="shadow-2xl shadow-black/50">
            <canvas ref={canvasRef} />
          </div>
        </div>
        <LayersPanel
          onAddLayer={() => {
            if (!canAddLayer(tier, layers.length)) return;
            const canvas = fabricRef.current;
            if (!canvas) return;
            const rect = new Rect({
              left: 100,
              top: 100,
              width: 200,
              height: 200,
              fill: "transparent",
              stroke: brushColor,
              strokeWidth: 2,
            });
            const meta = assignLayerMeta(rect, `レイヤー ${layerCounter.current}`);
            canvas.add(rect);
            addLayer({ id: meta.layerId, name: meta.layerName, visible: true, locked: false });
            canvas.setActiveObject(rect);
            canvas.renderAll();
          }}
          onDeleteLayer={(id) => {
            const canvas = fabricRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find(
              (o) => (o.get("data") as { layerId?: string })?.layerId === id,
            );
            if (obj) {
              canvas.remove(obj);
              removeLayer(id);
              canvas.renderAll();
            }
          }}
          onSelectLayer={(id) => {
            const canvas = fabricRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find(
              (o) => (o.get("data") as { layerId?: string })?.layerId === id,
            );
            if (obj) {
              canvas.setActiveObject(obj);
              canvas.renderAll();
              setSelectedLayerId(id);
            }
          }}
          onToggleVisibility={(id) => {
            const canvas = fabricRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find(
              (o) => (o.get("data") as { layerId?: string })?.layerId === id,
            );
            if (obj) {
              obj.visible = !obj.visible;
              updateLayer(id, { visible: obj.visible });
              canvas.renderAll();
            }
          }}
          onToggleLock={(id) => {
            const canvas = fabricRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find(
              (o) => (o.get("data") as { layerId?: string })?.layerId === id,
            );
            if (obj) {
              obj.selectable = !obj.selectable;
              obj.evented = obj.selectable;
              updateLayer(id, { locked: !obj.selectable });
              canvas.renderAll();
            }
          }}
        />
        <PropertiesPanel />
        {showAgentPanel && <AgentPanel />}
      </div>
      <StatusBar />
      <ExportModal onExport={handleExport} />
      <KeyboardShortcutsModal />
      <CanvasSizeModal currentWidth={DEFAULT_CANVAS_WIDTH} currentHeight={DEFAULT_CANVAS_HEIGHT} onResize={(w,h)=>{const canvas=fabricRef.current;if(!canvas)return;canvas.setDimensions({width:w,height:h}); canvas.renderAll();}} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".json,.editional.json,application/json"
        className="hidden"
        onChange={handleProjectChange}
      />
      <AiCommandPalette
        appName="Meteor Photo"
        isOpen={showAiPalette}
        onClose={() => setShowAiPalette(false)}
        onExecuteCommand={runAiCommand}
        suggestions={["青い矩形とテキストを追加", "タイトル追加", "レイヤー確認"]}
      />
      <ProjectBrowserModal
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        defaultAppId="photo"
      />
    </div>
  );
}
