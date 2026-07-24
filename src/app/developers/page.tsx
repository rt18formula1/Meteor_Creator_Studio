"use client";

import { HubHeader } from "@/components/hub/HubHeader";
import { DEVELOPMENT_UNLOCKED, PLAN_DESIGN_LIMITS } from "@/lib/freemium";
import Link from "next/link";
import { Bot, Code, ExternalLink } from "lucide-react";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1", desc: "API 情報" },
  { method: "GET", path: "/api/v1/openapi", desc: "OpenAPI 3.1 仕様" },
  { method: "GET", path: "/api/v1/tools", desc: "MCP互換ツール定義" },
  { method: "GET", path: "/api/v1/photo/canvas", desc: "空キャンバス取得" },
  { method: "POST", path: "/api/v1/photo/execute", desc: "コマンド実行（推奨）" },
  { method: "POST", path: "/api/v1/agent/run", desc: "高レベルエージェント実行" },
];

export default function DevelopersPage() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const freeLimits = PLAN_DESIGN_LIMITS.free;
  const proLimits = PLAN_DESIGN_LIMITS.pro;

  return (
    <div className="flex h-full flex-col">
      <HubHeader />
      <main className="lumina-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="mb-8 flex items-start gap-4">
            <div className="rounded-lg bg-lumina-accent/20 p-3">
              <Bot className="h-8 w-8 text-lumina-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Agent API</h1>
              <p className="mt-2 text-sm text-lumina-text-muted">
                Manus 等の外部AIエージェントが Editional Photo を操作するための REST API です。
                ステートレス設計のため、キャンバス JSON をリクエストごとに送受信します。
              </p>
            </div>
          </div>

          <section className="mb-8 rounded-xl border border-lumina-border bg-lumina-bg-elevated p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Code className="h-4 w-4 text-lumina-accent" />
              クイックスタート
            </h2>
            <pre className="overflow-x-auto rounded-lg bg-lumina-bg p-4 text-[11px] leading-relaxed text-lumina-text">
{`# 1. 空キャンバスを取得
curl "${baseUrl}/api/v1/photo/canvas?tier=free&width=1920&height=1080"

# 2. コマンドを実行
curl -X POST ${baseUrl}/api/v1/photo/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "tier": "free",
    "canvas": { "objects": [...], "background": "#fff" },
    "commands": [
      { "type": "add_text", "text": "Hello AI", "x": 200, "y": 200 },
      { "type": "add_rectangle", "x": 100, "y": 100, "width": 400, "height": 200, "fill": "#1473e6" }
    ]
  }'`}
            </pre>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-lumina-text-muted">
              エンドポイント
            </h2>
            <div className="space-y-2">
              {ENDPOINTS.map((ep) => (
                <div
                  key={ep.path}
                  className="flex items-center gap-3 rounded-lg border border-lumina-border bg-lumina-bg-elevated px-4 py-3"
                >
                  <span className="w-12 shrink-0 font-mono text-[10px] font-bold text-lumina-accent">
                    {ep.method}
                  </span>
                  <code className="flex-1 text-[11px] text-lumina-text">{ep.path}</code>
                  <span className="text-[11px] text-lumina-text-muted">{ep.desc}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8 rounded-xl border border-lumina-border bg-lumina-bg-elevated p-6">
            <h2 className="mb-2 text-sm font-semibold">フリーミアム制限</h2>
            {DEVELOPMENT_UNLOCKED && (
              <p className="mb-3 rounded border border-lumina-accent/30 bg-lumina-accent/10 p-2 text-[11px] text-lumina-text-muted">
                開発中は動作確認を優先するため、API実行時の価格壁は解除されています。
              </p>
            )}
            <div className="grid gap-2 text-[11px] text-lumina-text-muted sm:grid-cols-2">
              <div className="rounded border border-lumina-border bg-lumina-bg p-3">
                <p className="mb-1 font-semibold text-lumina-text">Free</p>
                <p>
                  {freeLimits.maxLayers}レイヤー、{freeLimits.maxCanvasWidth}×{freeLimits.maxCanvasHeight}px、
                  {freeLimits.exportFormats.join(" / ")}。高度なフィルターは利用できません。
                </p>
              </div>
              <div className="rounded border border-lumina-pro/40 bg-lumina-pro/10 p-3">
                <p className="mb-1 font-semibold text-lumina-text">Pro</p>
                <p>
                  レイヤー無制限、最大{proLimits.maxCanvasWidth.toLocaleString()}px、
                  全フォーマット、高度なフィルター、バッチ処理に対応します。
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-xl border border-lumina-border bg-lumina-bg-elevated p-6">
            <h2 className="mb-2 text-sm font-semibold">認証</h2>
            <p className="text-[11px] text-lumina-text-muted">
              環境変数 <code className="text-lumina-accent">EDITIONAL_AGENT_API_KEY</code> を設定すると、
              リクエストに <code className="text-lumina-accent">X-Editional-Api-Key</code> ヘッダーが必須になります。
              未設定の場合は認証なしで利用可能（開発用）。
            </p>
          </section>

          <div className="flex gap-4">
            <Link
              href="/api/v1/openapi"
              target="_blank"
              className="flex items-center gap-2 text-sm text-lumina-accent hover:underline"
            >
              OpenAPI JSON
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/api/v1/tools"
              target="_blank"
              className="flex items-center gap-2 text-sm text-lumina-accent hover:underline"
            >
              ツール定義
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link href="/apps/photo" className="text-sm text-lumina-accent hover:underline">
              エディターで試す
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
