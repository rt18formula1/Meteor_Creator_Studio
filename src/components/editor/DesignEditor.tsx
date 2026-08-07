"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  Link2,
  Folder,
} from "lucide-react";
import { AiCommandPalette } from "@/components/agent/AiCommandPalette";
import { ProjectBrowserModal } from "@/components/hub/ProjectBrowserModal";

interface UIComponent {
  id: string;
  type: "button" | "input" | "card" | "navbar";
  title: string;
  x: number;
  y: number;
}

interface Artboard {
  id: string;
  name: string;
  device: "mobile" | "tablet" | "desktop";
  width: number;
  height: number;
  components: UIComponent[];
  targetArtboardId?: string; // プロトタイプ矢印の接続先
}

export function DesignEditor() {
  const [artboards, setArtboards] = useState<Artboard[]>([
    {
      id: "artboard-1",
      name: "ログイン画面",
      device: "mobile",
      width: 320,
      height: 568,
      components: [
        { id: "c-1", type: "navbar", title: "ログイン", x: 20, y: 30 },
        { id: "c-2", type: "input", title: "メールアドレスを入力", x: 20, y: 120 },
        { id: "c-3", type: "button", title: "ログイン", x: 20, y: 200 },
      ],
      targetArtboardId: "artboard-2",
    },
    {
      id: "artboard-2",
      name: "ダッシュボード",
      device: "mobile",
      width: 320,
      height: 568,
      components: [
        { id: "c-4", type: "navbar", title: "ホーム", x: 20, y: 30 },
        { id: "c-5", type: "card", title: "アナリティクスカード", x: 20, y: 100 },
      ],
    },
  ]);

  const [selectedArtboardId, setSelectedArtboardId] = useState<string>("artboard-1");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [showPrototypeLinks, setShowPrototypeLinks] = useState(true);
  const [showAiPalette, setShowAiPalette] = useState(false);
  const [showProjectBrowser, setShowProjectBrowser] = useState(false);

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

  const addArtboard = (device: "mobile" | "tablet" | "desktop") => {
    const dim =
      device === "mobile"
        ? { width: 320, height: 568 }
        : device === "tablet"
        ? { width: 480, height: 640 }
        : { width: 640, height: 400 };

    const newArtboard: Artboard = {
      id: `artboard-${Date.now()}`,
      name: `画面 ${artboards.length + 1}`,
      device,
      width: dim.width,
      height: dim.height,
      components: [],
    };
    setArtboards([...artboards, newArtboard]);
    setSelectedArtboardId(newArtboard.id);
  };

  const addComponentToActive = (type: "button" | "input" | "card" | "navbar") => {
    setArtboards(
      artboards.map((ab) => {
        if (ab.id !== selectedArtboardId) return ab;
        const newComp: UIComponent = {
          id: `comp-${Date.now()}`,
          type,
          title: type === "button" ? "ボタン" : type === "input" ? "入力フィールド" : type === "card" ? "カード要素" : "ヘッダー",
          x: 30,
          y: 40 + ab.components.length * 50,
        };
        return { ...ab, components: [...ab.components, newComp] };
      })
    );
  };

  const activeArtboard = artboards.find((a) => a.id === selectedArtboardId);

  const runAiCommand = useCallback(
    async (text: string): Promise<string> => {
      const t = text.toLowerCase();
      if (t.includes("画面") || t.includes("アートボード") || t.includes("artboard")) {
        addArtboard(t.includes("デスクトップ") || t.includes("desktop") ? "desktop" : t.includes("タブレット") || t.includes("tablet") ? "tablet" : "mobile");
        return "新しいアートボードを追加しました。";
      }
      if (t.includes("ボタン") || t.includes("button")) {
        addComponentToActive("button");
        return "ボタンコンポーネントを追加しました。";
      }
      if (t.includes("入力") || t.includes("input") || t.includes("フィールド")) {
        addComponentToActive("input");
        return "入力フィールドを追加しました。";
      }
      if (t.includes("カード") || t.includes("card")) {
        addComponentToActive("card");
        return "カードコンポーネントを追加しました。";
      }
      if (t.includes("ナビ") || t.includes("ヘッダー") || t.includes("navbar")) {
        addComponentToActive("navbar");
        return "ナビバーを追加しました。";
      }
      return "解釈できませんでした。例: 「ボタンを追加」「モバイル画面を追加」";
    },
    [artboards, selectedArtboardId],
  );

  return (
    <div className="flex h-full flex-col bg-[#11111b] text-lumina-text select-none">
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
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-pink-500 to-fuchsia-700 text-xs font-bold text-white">
              Xd
            </div>
            <span className="text-sm font-semibold tracking-tight">Editional Design</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrototypeLinks(!showPrototypeLinks)}
            className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition ${
              showPrototypeLinks
                ? "border-pink-500/40 bg-pink-600/20 text-pink-300"
                : "border-lumina-border text-lumina-text-muted hover:bg-lumina-bg-hover"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>プロトタイプ表示</span>
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
          <button
            onClick={() => addArtboard("mobile")}
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="モバイル画面追加"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            onClick={() => addArtboard("tablet")}
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="タブレット画面追加"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => addArtboard("desktop")}
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            title="デスクトップ画面追加"
          >
            <Monitor className="h-4 w-4" />
          </button>
        </aside>

        {/* キャンバス領域（複数アートボード並置） */}
        <div className="relative flex flex-1 items-center gap-12 overflow-auto bg-[#0a0a0f] p-12">
          {artboards.map((ab) => {
            const isSelected = ab.id === selectedArtboardId;

            return (
              <div key={ab.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-lumina-text-muted">
                  <span className="font-semibold text-lumina-text">{ab.name}</span>
                  <span className="text-[10px] opacity-50">{ab.width} x {ab.height}</span>
                </div>

                <div
                  onClick={() => setSelectedArtboardId(ab.id)}
                  className={`relative rounded-xl border bg-[#181825] shadow-2xl transition-all ${
                    isSelected ? "ring-2 ring-pink-500 border-pink-500" : "border-lumina-border/60 hover:border-pink-500/50"
                  }`}
                  style={{ width: `${ab.width}px`, height: `${ab.height}px` }}
                >
                  {/* アートボード内のUIコンポーネント配置 */}
                  {ab.components.map((c) => (
                    <div
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArtboardId(ab.id);
                        setSelectedComponentId(c.id);
                      }}
                      className={`absolute rounded border p-2 text-xs transition cursor-pointer ${
                        selectedComponentId === c.id
                          ? "border-pink-400 bg-pink-500/20 text-white shadow-md"
                          : "border-lumina-border/50 bg-[#1e1e2e]/80 text-lumina-text hover:border-pink-400/50"
                      }`}
                      style={{ left: `${c.x}px`, top: `${c.y}px`, width: `${ab.width - 40}px` }}
                    >
                      {c.type === "button" && (
                        <div className="flex items-center justify-center rounded bg-pink-600 py-1.5 font-semibold text-white shadow">
                          {c.title}
                        </div>
                      )}
                      {c.type === "input" && (
                        <div className="rounded border border-lumina-border bg-[#11111b] px-3 py-1.5 text-lumina-text-muted text-[11px]">
                          {c.title}
                        </div>
                      )}
                      {c.type === "card" && (
                        <div className="rounded border border-lumina-border/60 bg-[#1e1e2e] p-3">
                          <div className="h-3 w-20 rounded bg-pink-500/30 mb-2" />
                          <div className="h-2 w-32 rounded bg-lumina-text-muted/20" />
                        </div>
                      )}
                      {c.type === "navbar" && (
                        <div className="flex items-center justify-between border-b border-lumina-border/60 pb-2">
                          <span className="font-bold">{c.title}</span>
                          <div className="h-4 w-4 rounded-full bg-pink-500/40" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 右側パネル */}
        <aside className="flex w-64 shrink-0 flex-col border-l border-lumina-border bg-[#181825]">
          <div className="border-b border-lumina-border p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-lumina-text-muted">
              UI パーツライブラリ
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => addComponentToActive("button")}
                className="rounded border border-lumina-border bg-[#1e1e2e] p-2 hover:bg-lumina-bg-hover text-left font-medium"
              >
                + ボタン
              </button>
              <button
                onClick={() => addComponentToActive("input")}
                className="rounded border border-lumina-border bg-[#1e1e2e] p-2 hover:bg-lumina-bg-hover text-left font-medium"
              >
                + 入力枠
              </button>
              <button
                onClick={() => addComponentToActive("card")}
                className="rounded border border-lumina-border bg-[#1e1e2e] p-2 hover:bg-lumina-bg-hover text-left font-medium"
              >
                + カード
              </button>
              <button
                onClick={() => addComponentToActive("navbar")}
                className="rounded border border-lumina-border bg-[#1e1e2e] p-2 hover:bg-lumina-bg-hover text-left font-medium"
              >
                + ヘッダー
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-lumina-text-muted">
              プロトタイプ接続
            </h4>
            {activeArtboard ? (
              <div className="space-y-3 text-xs">
                <label className="text-[10px] text-lumina-text-muted">遷移先画面</label>
                <select
                  value={activeArtboard.targetArtboardId || ""}
                  onChange={(e) => {
                    const targetId = e.target.value;
                    setArtboards(
                      artboards.map((ab) =>
                        ab.id === activeArtboard.id ? { ...ab, targetArtboardId: targetId } : ab
                      )
                    );
                  }}
                  className="w-full rounded border border-lumina-border bg-[#1e1e2e] p-2 text-xs text-lumina-text"
                >
                  <option value="">なし</option>
                  {artboards
                    .filter((a) => a.id !== activeArtboard.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
      <AiCommandPalette
        appName="Editional Design"
        isOpen={showAiPalette}
        onClose={() => setShowAiPalette(false)}
        onExecuteCommand={runAiCommand}
        suggestions={["ボタンを追加", "入力フィールドを追加", "モバイル画面を追加", "カードを追加"]}
      />
      <ProjectBrowserModal
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        defaultAppId="design"
      />
    </div>
  );
}
