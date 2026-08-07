"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Type,
  Image,
  Grid,
  Columns,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  BookOpen,
  Maximize2,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Folder,
} from "lucide-react";
import { AiCommandPalette } from "@/components/agent/AiCommandPalette";
import { ProjectBrowserModal } from "@/components/hub/ProjectBrowserModal";

interface TextFrame {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  columns: number;
  columnGap: number;
}

interface ImageFrame {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface Page {
  id: string;
  name: string;
  textFrames: TextFrame[];
  imageFrames: ImageFrame[];
}

const PAGE_WIDTH = 595; // A4 比率ベース (pt)
const PAGE_HEIGHT = 842;

const SCALE = 0.72; // 画面に収まるスケール

export function LayoutEditor() {
  const [pages, setPages] = useState<Page[]>([
    { id: "page-1", name: "ページ 1", textFrames: [], imageFrames: [] },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "image">("select");
  const [dragging, setDragging] = useState<{ id: string; type: "text" | "image"; offsetX: number; offsetY: number } | null>(null);
  const [showAiPalette, setShowAiPalette] = useState(false);
  const [showProjectBrowser, setShowProjectBrowser] = useState(false);

  const currentPage = pages[currentPageIndex];

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowAiPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const addTextFrameAt = () => {
    const updatedPages = [...pages];
    const page = { ...updatedPages[currentPageIndex] };
    const newFrame: TextFrame = {
      id: `tf-${Date.now()}`,
      x: 60,
      y: 80 + page.textFrames.length * 30,
      width: 240,
      height: 120,
      text: "AI が追加したテキストフレームです。",
      fontSize: 12,
      fontWeight: "normal",
      textAlign: "left",
      columns: 1,
      columnGap: 12,
    };
    page.textFrames = [...page.textFrames, newFrame];
    updatedPages[currentPageIndex] = page;
    setPages(updatedPages);
    setSelectedFrameId(newFrame.id);
  };

  const addImageFrameAt = () => {
    const updatedPages = [...pages];
    const page = { ...updatedPages[currentPageIndex] };
    const newFrame: ImageFrame = {
      id: `if-${Date.now()}`,
      x: 80,
      y: 120 + page.imageFrames.length * 30,
      width: 160,
      height: 120,
      label: `画像 ${page.imageFrames.length + 1}`,
    };
    page.imageFrames = [...page.imageFrames, newFrame];
    updatedPages[currentPageIndex] = page;
    setPages(updatedPages);
    setSelectedFrameId(newFrame.id);
  };

  const runAiCommand = async (prompt: string): Promise<string> => {
    const t = prompt.toLowerCase();
    if (t.includes("ページ") || t.includes("page")) {
      addPage();
      return "新しいページを追加しました。";
    }
    if (t.includes("画像") || t.includes("image")) {
      addImageFrameAt();
      return "画像フレームを追加しました。";
    }
    if (t.includes("テキスト") || t.includes("文字") || t.includes("text")) {
      addTextFrameAt();
      return "テキストフレームを追加しました。";
    }
    if (t.includes("グリッド") || t.includes("grid")) {
      setShowGrid((v) => !v);
      return "グリッド表示を切り替えました。";
    }
    return "例: 「テキストを追加」「ページを追加」「画像フレームを追加」";
  };


  // ページ操作
  const addPage = () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      name: `ページ ${pages.length + 1}`,
      textFrames: [],
      imageFrames: [],
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const deletePage = () => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== currentPageIndex);
    setPages(newPages);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  };

  const goToPrev = () => setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  const goToNext = () => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1));

  // フレーム追加
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "select") {
      // クリック先にフレームがなければ選択解除
      setSelectedFrameId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / SCALE;
    const y = (e.clientY - rect.top) / SCALE;

    const updatedPages = [...pages];
    const page = { ...updatedPages[currentPageIndex] };

    if (activeTool === "text") {
      const newFrame: TextFrame = {
        id: `tf-${Date.now()}`,
        x: Math.max(20, x - 120),
        y: Math.max(20, y - 40),
        width: 240,
        height: 120,
        text: "ここにテキストを入力してください。Meteor Layout では段組みやフォントサイズの調整が可能です。",
        fontSize: 11,
        fontWeight: "normal",
        textAlign: "left",
        columns: 1,
        columnGap: 12,
      };
      page.textFrames = [...page.textFrames, newFrame];
      setSelectedFrameId(newFrame.id);
    } else if (activeTool === "image") {
      const newFrame: ImageFrame = {
        id: `if-${Date.now()}`,
        x: Math.max(20, x - 80),
        y: Math.max(20, y - 60),
        width: 160,
        height: 120,
        label: `画像 ${page.imageFrames.length + 1}`,
      };
      page.imageFrames = [...page.imageFrames, newFrame];
      setSelectedFrameId(newFrame.id);
    }

    updatedPages[currentPageIndex] = page;
    setPages(updatedPages);
    setActiveTool("select");
  };

  // フレーム選択
  const selectFrame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFrameId(id);
  };

  // テキストフレームの内容更新
  const updateTextFrame = (frameId: string, updates: Partial<TextFrame>) => {
    const updatedPages = [...pages];
    const page = { ...updatedPages[currentPageIndex] };
    page.textFrames = page.textFrames.map((f) =>
      f.id === frameId ? { ...f, ...updates } : f
    );
    updatedPages[currentPageIndex] = page;
    setPages(updatedPages);
  };

  // フレーム削除
  const deleteFrame = (id: string) => {
    const updatedPages = [...pages];
    const page = { ...updatedPages[currentPageIndex] };
    page.textFrames = page.textFrames.filter((f) => f.id !== id);
    page.imageFrames = page.imageFrames.filter((f) => f.id !== id);
    updatedPages[currentPageIndex] = page;
    setPages(updatedPages);
    if (selectedFrameId === id) setSelectedFrameId(null);
  };

  // ドラッグ開始
  const startDrag = (id: string, type: "text" | "image", e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    setDragging({
      id,
      type,
      offsetX: e.clientX,
      offsetY: e.clientY,
    });
    setSelectedFrameId(id);
  };

  // ドラッグ中
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragging.offsetX) / SCALE;
    const dy = (e.clientY - dragging.offsetY) / SCALE;

    const updatedPages = [...pages];
    const page = { ...updatedPages[currentPageIndex] };

    if (dragging.type === "text") {
      page.textFrames = page.textFrames.map((f) =>
        f.id === dragging.id ? { ...f, x: f.x + dx, y: f.y + dy } : f
      );
    } else {
      page.imageFrames = page.imageFrames.map((f) =>
        f.id === dragging.id ? { ...f, x: f.x + dx, y: f.y + dy } : f
      );
    }

    updatedPages[currentPageIndex] = page;
    setPages(updatedPages);
    setDragging({ ...dragging, offsetX: e.clientX, offsetY: e.clientY });
  };

  const handleMouseUp = () => setDragging(null);

  // 選択中のテキストフレームを取得
  const selectedTextFrame = currentPage.textFrames.find((f) => f.id === selectedFrameId);

  return (
    <div
      className="flex h-full flex-col bg-[#11111b] text-lumina-text select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ヘッダー */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-lumina-border bg-[#181825] px-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="ホームに戻る"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>ホーム</span>
          </Link>
          <div className="flex items-center gap-2 border-l border-lumina-border pl-4">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-pink-600 to-rose-600 text-xs font-bold text-white">
              La
            </div>
            <span className="text-sm font-semibold tracking-tight">Meteor Layout</span>
          </div>

          {/* ページナビゲーション */}
          <div className="flex items-center gap-1.5 border-l border-lumina-border pl-6">
            <button
              onClick={goToPrev}
              disabled={currentPageIndex === 0}
              className="rounded p-1.5 hover:bg-lumina-bg-hover disabled:opacity-30 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono px-2 text-lumina-text-muted">
              {currentPageIndex + 1} / {pages.length}
            </span>
            <button
              onClick={goToNext}
              disabled={currentPageIndex === pages.length - 1}
              className="rounded p-1.5 hover:bg-lumina-bg-hover disabled:opacity-30 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs transition ${
              showGrid
                ? "border-pink-500/30 bg-pink-600/15 text-pink-300"
                : "border-lumina-border text-lumina-text-muted hover:bg-lumina-bg-hover"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>グリッド</span>
          </button>
          <button
            type="button"
            onClick={addPage}
            className="flex items-center gap-1.5 rounded bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-pink-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ページ追加</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAiPalette(true)}
            className="flex items-center gap-1.5 rounded border border-pink-500/30 bg-pink-600/15 px-3 py-1.5 text-xs font-medium text-pink-300 transition hover:bg-pink-600/30"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI</span>
          </button>
          <button
            type="button"
            onClick={() => setShowProjectBrowser(true)}
            className="flex items-center gap-1.5 rounded border border-lumina-border px-3 py-1.5 text-xs font-medium text-lumina-text-muted transition hover:bg-lumina-bg-hover"
          >
            <Folder className="h-3.5 w-3.5" />
            <span>プロジェクト</span>
          </button>
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側ツールバー */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-lumina-border bg-[#181825] py-2">
          {[
            { id: "select" as const, icon: <Maximize2 className="h-4 w-4" />, label: "選択・移動" },
            { id: "text" as const, icon: <Type className="h-4 w-4" />, label: "テキストフレーム" },
            { id: "image" as const, icon: <Image className="h-4 w-4" />, label: "画像フレーム" },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex h-9 w-9 items-center justify-center rounded transition ${
                activeTool === tool.id
                  ? "bg-pink-600/20 text-pink-400 border border-pink-500/30"
                  : "text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </aside>

        {/* キャンバスエリア */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#0a0a0f] p-8">
          <div
            onClick={handleCanvasClick}
            className="relative bg-white shadow-2xl shadow-black/50"
            style={{
              width: PAGE_WIDTH * SCALE,
              height: PAGE_HEIGHT * SCALE,
              cursor: activeTool !== "select" ? "crosshair" : "default",
            }}
          >
            {/* グリッド */}
            {showGrid && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={PAGE_WIDTH * SCALE}
                height={PAGE_HEIGHT * SCALE}
              >
                <defs>
                  <pattern
                    id="grid-pattern"
                    width={20 * SCALE}
                    height={20 * SCALE}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${20 * SCALE} 0 L 0 0 0 ${20 * SCALE}`}
                      fill="none"
                      stroke="rgba(0,0,0,0.06)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                {/* マージンガイド */}
                <rect
                  x={40 * SCALE}
                  y={40 * SCALE}
                  width={(PAGE_WIDTH - 80) * SCALE}
                  height={(PAGE_HEIGHT - 80) * SCALE}
                  fill="none"
                  stroke="rgba(236,72,153,0.2)"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
              </svg>
            )}

            {/* テキストフレーム */}
            {currentPage.textFrames.map((frame) => (
              <div
                key={frame.id}
                onClick={(e) => selectFrame(frame.id, e)}
                onMouseDown={(e) => startDrag(frame.id, "text", e)}
                className={`absolute border transition-shadow cursor-move ${
                  selectedFrameId === frame.id
                    ? "border-pink-500 shadow-lg shadow-pink-500/20"
                    : "border-gray-300 hover:border-pink-400"
                }`}
                style={{
                  left: frame.x * SCALE,
                  top: frame.y * SCALE,
                  width: frame.width * SCALE,
                  height: frame.height * SCALE,
                }}
              >
                <div
                  className="h-full w-full overflow-hidden p-1.5"
                  style={{
                    fontSize: frame.fontSize * SCALE,
                    fontWeight: frame.fontWeight,
                    textAlign: frame.textAlign,
                    color: "#1a1a2e",
                    lineHeight: 1.6,
                    columnCount: frame.columns,
                    columnGap: frame.columnGap * SCALE,
                  }}
                >
                  {frame.text}
                </div>
              </div>
            ))}

            {/* 画像フレーム */}
            {currentPage.imageFrames.map((frame) => (
              <div
                key={frame.id}
                onClick={(e) => selectFrame(frame.id, e)}
                onMouseDown={(e) => startDrag(frame.id, "image", e)}
                className={`absolute border flex items-center justify-center cursor-move transition-shadow ${
                  selectedFrameId === frame.id
                    ? "border-pink-500 shadow-lg shadow-pink-500/20"
                    : "border-gray-300 hover:border-pink-400"
                }`}
                style={{
                  left: frame.x * SCALE,
                  top: frame.y * SCALE,
                  width: frame.width * SCALE,
                  height: frame.height * SCALE,
                  background:
                    "repeating-conic-gradient(#e0e0e0 0% 25%, #f5f5f5 0% 50%) 50% / 16px 16px",
                }}
              >
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <Image className="h-5 w-5" />
                  <span className="text-[8px] font-medium">{frame.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右側パネル */}
        <aside className="w-64 shrink-0 border-l border-lumina-border bg-[#181825] flex flex-col">
          {/* プロパティ */}
          {selectedTextFrame ? (
            <div className="border-b border-lumina-border p-4">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-lumina-text-muted">
                テキストフレーム設定
              </h3>
              <div className="space-y-3">
                {/* テキスト */}
                <div>
                  <label className="mb-1 block text-[10px] text-lumina-text-muted">テキスト</label>
                  <textarea
                    value={selectedTextFrame.text}
                    onChange={(e) => updateTextFrame(selectedTextFrame.id, { text: e.target.value })}
                    rows={3}
                    className="w-full rounded border border-lumina-border bg-[#1e1e2e] px-2 py-1.5 text-xs text-lumina-text resize-none focus:border-pink-500 outline-none"
                  />
                </div>

                {/* フォントサイズ */}
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-lumina-text-muted">
                    <span>フォントサイズ</span>
                    <span>{selectedTextFrame.fontSize}pt</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="72"
                    value={selectedTextFrame.fontSize}
                    onChange={(e) =>
                      updateTextFrame(selectedTextFrame.id, { fontSize: parseInt(e.target.value) })
                    }
                    className="w-full accent-pink-600"
                  />
                </div>

                {/* テキスト揃え */}
                <div>
                  <label className="mb-1 block text-[10px] text-lumina-text-muted">テキスト揃え</label>
                  <div className="flex gap-1">
                    {([
                      { val: "left" as const, icon: <AlignLeft className="h-3.5 w-3.5" /> },
                      { val: "center" as const, icon: <AlignCenter className="h-3.5 w-3.5" /> },
                      { val: "right" as const, icon: <AlignRight className="h-3.5 w-3.5" /> },
                    ] as const).map((a) => (
                      <button
                        key={a.val}
                        onClick={() => updateTextFrame(selectedTextFrame.id, { textAlign: a.val })}
                        className={`flex-1 flex justify-center rounded border py-1.5 text-xs transition ${
                          selectedTextFrame.textAlign === a.val
                            ? "bg-pink-600/15 border-pink-500/30 text-pink-300"
                            : "border-lumina-border bg-[#1e1e2e] hover:bg-lumina-bg-hover"
                        }`}
                      >
                        {a.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 太字 */}
                <div>
                  <label className="mb-1 block text-[10px] text-lumina-text-muted">太字</label>
                  <button
                    onClick={() =>
                      updateTextFrame(selectedTextFrame.id, {
                        fontWeight: selectedTextFrame.fontWeight === "bold" ? "normal" : "bold",
                      })
                    }
                    className={`rounded border px-3 py-1 text-xs font-bold transition ${
                      selectedTextFrame.fontWeight === "bold"
                        ? "bg-pink-600/15 border-pink-500/30 text-pink-300"
                        : "border-lumina-border bg-[#1e1e2e] hover:bg-lumina-bg-hover"
                    }`}
                  >
                    B
                  </button>
                </div>

                {/* 段組み */}
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-lumina-text-muted">
                    <span>段組み</span>
                    <span>{selectedTextFrame.columns}段</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => updateTextFrame(selectedTextFrame.id, { columns: n })}
                        className={`flex-1 rounded border py-1 text-[10px] transition ${
                          selectedTextFrame.columns === n
                            ? "bg-pink-600/15 border-pink-500/30 text-pink-300"
                            : "border-lumina-border bg-[#1e1e2e] hover:bg-lumina-bg-hover"
                        }`}
                      >
                        {n}段
                      </button>
                    ))}
                  </div>
                </div>

                {/* 削除 */}
                <button
                  onClick={() => deleteFrame(selectedTextFrame.id)}
                  className="w-full flex items-center justify-center gap-1 rounded border border-red-500/30 bg-red-500/10 py-1.5 text-[10px] text-red-400 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>フレーム削除</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border-b border-lumina-border p-4">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-lumina-text-muted">
                プロパティ
              </h3>
              <p className="text-[10px] text-lumina-text-muted">
                フレームを選択するか、ツールバーからテキスト/画像フレームを配置してください。
              </p>
            </div>
          )}

          {/* ページ一覧 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-lumina-border px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lumina-text-muted flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                ページ一覧
              </span>
              <div className="flex gap-1">
                <button
                  onClick={addPage}
                  className="rounded p-1 text-lumina-text-muted hover:text-pink-400 hover:bg-pink-500/10"
                  title="ページ追加"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={deletePage}
                  disabled={pages.length <= 1}
                  className="rounded p-1 text-lumina-text-muted hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                  title="ページ削除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="lumina-scrollbar flex-1 overflow-y-auto p-3 space-y-2">
              {pages.map((page, i) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageIndex(i)}
                  className={`w-full rounded-lg p-3 text-left text-xs transition border ${
                    currentPageIndex === i
                      ? "bg-pink-600/15 border-pink-500/30 text-pink-200"
                      : "bg-[#1e1e2e]/40 border-transparent hover:bg-lumina-bg-hover text-lumina-text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{page.name}</span>
                    <span className="text-[9px] font-mono opacity-40">{i + 1}</span>
                  </div>
                  <div className="mt-1 text-[9px] opacity-50">
                    テキスト: {page.textFrames.length} / 画像: {page.imageFrames.length}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <AiCommandPalette
        appName="Meteor Layout"
        isOpen={showAiPalette}
        onClose={() => setShowAiPalette(false)}
        onExecuteCommand={runAiCommand}
        suggestions={["テキストを追加", "画像フレームを追加", "ページを追加", "グリッド切替"]}
      />
      <ProjectBrowserModal
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        defaultAppId="layout"
      />
    </div>
  );
}
