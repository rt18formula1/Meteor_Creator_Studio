"use client";

import { HubHeader } from "@/components/hub/HubHeader";
import { AppCard } from "@/components/hub/AppCard";
import { CREATIVE_APPS } from "@/lib/apps";
import { PLAN_LIMITS } from "@/lib/freemium";
import { getCloudProjects, getCloudProjectView } from "@/lib/editor/recent-projects";
import { useSubscription } from "@/store/use-subscription";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, HardDrive, Layers, Sparkles } from "lucide-react";

export default function HubPage() {
  const tier = useSubscription((s) => s.tier);
  const limits = PLAN_LIMITS[tier];
  const [recent, setRecent] = useState<ReturnType<typeof getCloudProjectView>[]>([]);

  useEffect(() => {
    setRecent(getCloudProjects().map(getCloudProjectView).slice(0, 6));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <HubHeader />
      <main className="lumina-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <section className="mb-10">
            <h1 className="text-2xl font-semibold text-lumina-text">
              おかえりなさい
            </h1>
            <p className="mt-1 text-sm text-lumina-text-muted">
              プロ向けクリエイティブツールを、無料から始められます。
              {tier === "free" && (
                <>
                  {" "}
                  <Link
                    href="/pricing"
                    className="text-lumina-accent hover:underline"
                  >
                    Proプラン
                  </Link>
                  で制限を解除。
                </>
              )}
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-lumina-text-muted">
              インストール済みアプリ
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CREATIVE_APPS.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-lumina-text-muted">
              クイックスタート
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <QuickAction
                href="/apps/photo"
                title="新規ドキュメント"
                description="1920×1080のキャンバスを作成"
              />
              <QuickAction
                href="/apps/photo"
                title="画像を開く"
                description="PNG / JPEG / WebP"
              />
              <QuickAction
                href="/developers"
                title="AI Agent API"
                description="Manus 等の外部AI連携"
              />
            </div>
          </section>

          {recent.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-lumina-text-muted">
                最近のプロジェクト
              </h2>
              <div className="space-y-2">
                {recent.map((p) => (
                  <Link
                    key={p.id}
                    href={p.href}
                    className="flex items-center justify-between rounded-lg border border-lumina-border bg-lumina-bg-elevated px-4 py-3 transition hover:border-lumina-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.appShortName}
                      </div>
                      <div>
                        <span className="text-sm text-lumina-text">{p.name}</span>
                        <p className="text-[10px] text-lumina-text-muted">{p.appName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-lumina-text-muted">
                      {new Date(p.updatedAt).toLocaleDateString("ja-JP")}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10 rounded-xl border border-lumina-accent/30 bg-lumina-accent/5 p-6">
            <div className="flex items-start gap-4">
              <Bot className="h-8 w-8 shrink-0 text-lumina-accent" />
              <div>
                <h2 className="text-sm font-semibold text-lumina-text">外部AIエージェント対応</h2>
                <p className="mt-1 text-[11px] text-lumina-text-muted">
                  Manus 等のAIが Meteor Photo を操作できる REST API を提供しています。
                  エディター内の AI Agent パネルからも同じ API を利用できます。
                </p>
                <Link
                  href="/developers"
                  className="mt-3 inline-block text-xs text-lumina-accent hover:underline"
                >
                  Agent API ドキュメント →
                </Link>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-lumina-text-muted">
              現在のプラン: {tier === "free" ? "無料" : "Pro"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PlanStat
                icon={<Layers className="h-4 w-4" />}
                label="レイヤー上限"
                value={
                  limits.maxLayers === Infinity
                    ? "無制限"
                    : `${limits.maxLayers}レイヤー`
                }
              />
              <PlanStat
                icon={<HardDrive className="h-4 w-4" />}
                label="クラウドストレージ"
                value={`${limits.cloudStorageGb} GB`}
              />
              <PlanStat
                icon={<Sparkles className="h-4 w-4" />}
                label="AI機能"
                value={limits.aiFeatures ? "利用可能" : "Pro限定"}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-lumina-border bg-lumina-bg-elevated p-4 transition hover:border-lumina-accent/40 hover:bg-lumina-bg-hover"
    >
      <h3 className="text-sm font-medium text-lumina-text">{title}</h3>
      <p className="mt-1 text-xs text-lumina-text-muted">{description}</p>
    </Link>
  );
}

function PlanStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-lumina-border bg-lumina-bg-elevated p-4">
      <div className="text-lumina-accent">{icon}</div>
      <div>
        <p className="text-[11px] text-lumina-text-muted">{label}</p>
        <p className="text-sm font-medium text-lumina-text">{value}</p>
      </div>
    </div>
  );
}
