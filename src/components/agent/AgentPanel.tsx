"use client";

import { useState } from "react";
import { useEditorBridge } from "@/store/use-editor-bridge";
import { useSubscription } from "@/store/use-subscription";
import type { EditorCommand } from "@/lib/editor/command-engine";
import { DEVELOPMENT_UNLOCKED, PLAN_DESIGN_LIMITS } from "@/lib/freemium";
import { Bot, Loader2, Send } from "lucide-react";

type AgentLog = {
  id: string;
  type: "user" | "agent" | "error";
  message: string;
  results?: { success: boolean; message: string }[];
};

const PRESETS: { label: string; commands: EditorCommand[] }[] = [
  {
    label: "タイトル追加",
    commands: [
      {
        type: "add_text",
        text: "Meteor",
        x: 760,
        y: 480,
        fontSize: 96,
        color: "#1473e6",
        layerName: "タイトル",
      },
    ],
  },
  {
    label: "ヒーロー矩形",
    commands: [
      {
        type: "add_rectangle",
        x: 360,
        y: 200,
        width: 1200,
        height: 600,
        fill: "#1473e6",
        layerName: "ヒーロー",
      },
      {
        type: "add_text",
        text: "Create with AI",
        x: 620,
        y: 420,
        fontSize: 64,
        color: "#ffffff",
        layerName: "キャッチコピー",
      },
    ],
  },
  {
    label: "レイヤー確認",
    commands: [{ type: "list_layers" }],
  },
];

export function AgentPanel() {
  const handlers = useEditorBridge((s) => s.handlers);
  const tier = useSubscription((s) => s.tier);
  const designedLimits = PLAN_DESIGN_LIMITS[tier];
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(false);

  const runCommands = async (commands: EditorCommand[], userMessage: string) => {
    if (!handlers) return;
    setLoading(true);
    setLogs((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, type: "user", message: userMessage },
    ]);

    try {
      const canvas = await handlers.getCanvasJson();
      const res = await fetch("/api/v1/photo/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas, commands, tier }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "API error");
      }

      await handlers.loadCanvasJson(data.canvas);
      setLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          type: "agent",
          message: `${data.results.length} コマンド実行完了`,
          results: data.results,
        },
      ]);
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const runPrompt = async () => {
    if (!prompt.trim() || !handlers) return;
    setLoading(true);
    try {
      const canvas = await handlers.getCanvasJson();
      const res = await fetch("/api/v1/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, canvas, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "API error");
      await handlers.loadCanvasJson(data.canvas);
      setLogs((prev) => [
        ...prev,
        { id: `${Date.now()}-u`, type: "user", message: prompt },
        {
          id: `${Date.now()}-a`,
          type: "agent",
          message: data.results?.map((r: { message: string }) => r.message).join(", ") ?? "完了",
          results: data.results,
        },
      ]);
      setPrompt("");
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-lumina-border bg-lumina-bg-panel">
      <div className="flex h-8 items-center gap-2 border-b border-lumina-border px-3">
        <Bot className="h-3.5 w-3.5 text-lumina-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-lumina-text-muted">
          AI Agent
        </span>
      </div>

      <div className="border-b border-lumina-border p-2">
        <div className="mb-2 rounded border border-lumina-border bg-lumina-bg-elevated p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-lumina-text">
              {tier === "free" ? "Free Agent" : "Pro Agent"}
            </span>
            <span className="rounded bg-lumina-accent/15 px-1.5 py-0.5 text-[9px] text-lumina-accent">
              /api/v1
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-lumina-text-muted">
            Manus 等の外部AIは同じ操作が可能です。{DEVELOPMENT_UNLOCKED
              ? "開発中はFreeでも制限解除中。"
              : ""}{tier === "free"
              ? `製品版Free想定: ${designedLimits.maxLayers}レイヤー、${designedLimits.maxCanvasWidth}×${designedLimits.maxCanvasHeight}px。`
              : "レイヤー無制限、高度なフィルター、4K以上のキャンバスに対応。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={loading || !handlers}
              onClick={() => runCommands(preset.commands, preset.label)}
              className="rounded bg-lumina-bg-hover px-2 py-1 text-[10px] text-lumina-text transition hover:bg-lumina-accent/20 disabled:opacity-40"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lumina-scrollbar flex-1 space-y-2 overflow-y-auto p-2">
        {logs.length === 0 && (
          <p className="p-2 text-[11px] text-lumina-text-muted">
            プリセットを実行するか、下のフォームでプロンプトを送信してください。
          </p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className={`rounded p-2 text-[11px] ${
              log.type === "user"
                ? "bg-lumina-accent/10 text-lumina-text"
                : log.type === "error"
                  ? "bg-lumina-danger/10 text-lumina-danger"
                  : "bg-lumina-bg-elevated text-lumina-text-muted"
            }`}
          >
            <p>{log.message}</p>
            {log.results && (
              <ul className="mt-1 space-y-0.5">
                {log.results.map((r, i) => (
                  <li key={i} className={r.success ? "text-lumina-success" : "text-lumina-danger"}>
                    {r.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-lumina-border p-2">
        <div className="flex gap-1">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runPrompt()}
            placeholder="例: 青い矩形とテキストを追加"
            className="flex-1 rounded border border-lumina-border bg-lumina-bg px-2 py-1.5 text-[11px] text-lumina-text outline-none focus:border-lumina-accent"
          />
          <button
            type="button"
            onClick={runPrompt}
            disabled={loading || !handlers || !prompt.trim()}
            className="rounded bg-lumina-accent px-2 py-1.5 text-lumina-text transition hover:bg-lumina-accent-hover disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
