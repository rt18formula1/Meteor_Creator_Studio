"use client";

import { HubHeader } from "@/components/hub/HubHeader";
import { CREATIVE_APPS } from "@/lib/apps";
import {
  DEVELOPMENT_UNLOCKED,
  PLAN_DESIGN_LIMITS,
  PLAN_LIMITS,
} from "@/lib/freemium";
import { getCloudProjects, getCloudProjectView } from "@/lib/editor/recent-projects";
import { useSubscription } from "@/store/use-subscription";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bot,
  ChevronRight,
  Cloud,
  FolderOpen,
  Grid2X2,
  HardDrive,
  Layers,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const HOME_NAV = [
  { label: "Apps", icon: Grid2X2 },
  { label: "Projects", icon: FolderOpen },
  { label: "Cloud", icon: Cloud },
  { label: "Agent API", icon: Bot },
];

const QUICK_STARTS = [
  { label: "新規 Photo", href: "/apps/photo", accent: "#31A8FF" },
  { label: "Vector 作成", href: "/apps/vector", accent: "#FF9A00" },
  { label: "動画編集", href: "/apps/video", accent: "#9999FF" },
  { label: "API 接続", href: "/developers", accent: "#2d9d78" },
];

export default function HubPage() {
  const tier = useSubscription((s) => s.tier);
  const runtimeLimits = PLAN_LIMITS[tier];
  const designLimits = PLAN_DESIGN_LIMITS[tier];
  const [recent, setRecent] = useState<ReturnType<typeof getCloudProjectView>[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setRecent(getCloudProjects().map(getCloudProjectView).slice(0, 6));
  }, []);

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CREATIVE_APPS;
    return CREATIVE_APPS.filter((app) =>
      `${app.name} ${app.shortName} ${app.description} ${app.category}`
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <div className="flex h-full flex-col bg-lumina-bg text-lumina-text">
      <HubHeader />
      <main className="flex min-h-0 flex-1">
        <aside className="hidden w-14 shrink-0 flex-col items-center border-r border-lumina-border bg-lumina-toolbar py-3 md:flex">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded bg-lumina-bg-elevated text-xs font-bold text-lumina-accent">
            M
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {HOME_NAV.map(({ label, icon: Icon }, index) => (
              <button
                key={label}
                type="button"
                title={label}
                className={`flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text ${
                  index === 0 ? "bg-lumina-bg-hover text-lumina-text" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </nav>
          <button
            type="button"
            title="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
          >
            <Bell className="h-4 w-4" />
          </button>
        </aside>

        <div className="lumina-scrollbar min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6">
            <section className="min-w-0 space-y-5">
              <div className="flex flex-col gap-4 rounded-lg border border-lumina-border bg-lumina-bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-lumina-text-muted">
                    Meteor Creator Studio
                  </p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight text-lumina-text">
                    制作アプリを起動
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-lumina-text-muted">
                    Adobe CC のようにアプリ、最近のプロジェクト、クラウド、AI Agent API をひとつのホームから扱えます。
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {QUICK_STARTS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-2 rounded border border-lumina-border bg-lumina-bg-panel px-3 py-2 text-xs font-medium text-lumina-text transition hover:border-lumina-accent/50 hover:bg-lumina-bg-hover"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.accent }}
                      />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatusTile
                  icon={<Sparkles className="h-4 w-4" />}
                  label="AI Agent"
                  value="操作API 有効"
                  tone="text-lumina-success"
                />
                <StatusTile
                  icon={<Layers className="h-4 w-4" />}
                  label="Runtime"
                  value={DEVELOPMENT_UNLOCKED ? "開発中 無制限" : formatLayerLimit(runtimeLimits.maxLayers)}
                  tone="text-lumina-accent"
                />
                <StatusTile
                  icon={<HardDrive className="h-4 w-4" />}
                  label="Cloud"
                  value={`${runtimeLimits.cloudStorageGb} GB`}
                  tone="text-lumina-pro"
                />
              </div>

              <section>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-lumina-text">アプリ</h2>
                    <p className="mt-0.5 text-[11px] text-lumina-text-muted">
                      Photo、Vector、Video、Layout から必要な制作環境を開きます。
                    </p>
                  </div>
                  <div className="relative sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-lumina-text-muted" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="アプリを検索"
                      className="h-9 w-full rounded border border-lumina-border bg-lumina-bg-panel pl-9 pr-3 text-xs text-lumina-text outline-none transition focus:border-lumina-accent"
                    />
                  </div>
                </div>

                {filteredApps.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {filteredApps.map((app) => (
                      <AppLaunchCard key={app.id} app={app} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-lumina-border bg-lumina-bg-elevated px-4 py-8 text-center text-xs text-lumina-text-muted">
                    一致するアプリがありません。
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-lumina-border bg-lumina-bg-elevated">
                <div className="flex items-center justify-between border-b border-lumina-border px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-lumina-text">最近のプロジェクト</h2>
                    <p className="mt-0.5 text-[11px] text-lumina-text-muted">
                      ローカルクラウドに保存された制作物
                    </p>
                  </div>
                  <Link
                    href="/apps/photo"
                    className="flex items-center gap-1 rounded border border-lumina-border bg-lumina-bg-panel px-2.5 py-1.5 text-xs text-lumina-text-muted transition hover:border-lumina-accent/50 hover:text-lumina-text"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    作成
                  </Link>
                </div>
                <div className="divide-y divide-lumina-border/70">
                  {recent.length > 0 ? (
                    recent.map((project) => (
                      <Link
                        key={project.id}
                        href={project.href}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-lumina-bg-hover"
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.appShortName}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-lumina-text">{project.name}</p>
                          <p className="text-[11px] text-lumina-text-muted">{project.appName}</p>
                        </div>
                        <span className="hidden text-[11px] text-lumina-text-muted sm:block">
                          {new Date(project.updatedAt).toLocaleDateString("ja-JP")}
                        </span>
                        <ChevronRight className="h-4 w-4 text-lumina-text-muted" />
                      </Link>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-6 text-lumina-text-muted">
                      <FolderOpen className="h-5 w-5" />
                      <p className="text-xs">まだプロジェクトがありません。アプリを開いて制作を開始できます。</p>
                    </div>
                  )}
                </div>
              </section>
            </section>

            <aside className="space-y-4">
              <section className="rounded-lg border border-lumina-border bg-lumina-bg-elevated p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-lumina-text">プラン</h2>
                  <span className="rounded bg-lumina-pro/15 px-2 py-1 text-[10px] font-semibold text-lumina-pro">
                    {tier === "free" ? "Free" : "Pro"}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-lumina-text-muted">
                  <PlanLine
                    label={tier === "free" ? "製品版Free想定" : "レイヤー"}
                    value={formatLayerLimit(designLimits.maxLayers)}
                  />
                  <PlanLine
                    label="キャンバス"
                    value={`${designLimits.maxCanvasWidth} x ${designLimits.maxCanvasHeight}`}
                  />
                  <PlanLine label="高度なフィルター" value={designLimits.advancedFilters ? "有効" : "Pro"} />
                </div>
                {DEVELOPMENT_UNLOCKED && (
                  <p className="mt-3 rounded border border-lumina-accent/30 bg-lumina-accent/10 p-2 text-[11px] leading-relaxed text-lumina-text-muted">
                    開発中は確認を優先してFreeの実行制限を解除しています。
                  </p>
                )}
              </section>

              <section className="rounded-lg border border-lumina-border bg-lumina-bg-elevated p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-lumina-success" />
                  <h2 className="text-sm font-semibold text-lumina-text">Agent API</h2>
                </div>
                <p className="text-xs leading-relaxed text-lumina-text-muted">
                  Manus 等の外部AIが Meteor Photo のキャンバスJSONを受け取り、同じコマンドエンジンで編集できます。
                </p>
                <Link
                  href="/developers"
                  className="mt-3 flex items-center justify-between rounded border border-lumina-border bg-lumina-bg-panel px-3 py-2 text-xs text-lumina-text transition hover:border-lumina-accent/50 hover:bg-lumina-bg-hover"
                >
                  APIドキュメント
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </section>

              <section className="rounded-lg border border-lumina-border bg-lumina-bg-elevated p-4">
                <h2 className="text-sm font-semibold text-lumina-text">Cloud Workspace</h2>
                <div className="mt-3 space-y-2">
                  {[
                    ["Projects", recent.length.toString()],
                    ["Sync", "Local"],
                    ["Storage", `${runtimeLimits.cloudStorageGb} GB`],
                  ].map(([label, value]) => (
                    <PlanLine key={label} label={label} value={value} />
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function AppLaunchCard({ app }: { app: (typeof CREATIVE_APPS)[number] }) {
  const available = app.status === "available";
  const body = (
    <div
      className={`group flex min-h-40 flex-col rounded-lg border bg-lumina-bg-elevated transition ${
        available
          ? "border-lumina-border hover:border-lumina-accent/50 hover:bg-lumina-bg-panel"
          : "border-lumina-border/60 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between p-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded text-base font-bold text-white shadow"
          style={{ backgroundColor: app.iconColor }}
        >
          {app.shortName}
        </div>
        <span className="rounded bg-lumina-bg-panel px-2 py-1 text-[10px] uppercase text-lumina-text-muted">
          {app.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between px-3 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-lumina-text">{app.name}</h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-lumina-text-muted">
            {app.description}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px]">
          <span className={available ? "text-lumina-success" : "text-lumina-text-muted"}>
            {available ? "Installed" : "Coming soon"}
          </span>
          {available && (
            <span className="flex items-center gap-1 font-medium text-lumina-accent opacity-0 transition group-hover:opacity-100">
              開く
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return available ? <Link href={app.href}>{body}</Link> : body;
}

function StatusTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-lumina-border bg-lumina-bg-elevated p-3">
      <div className={tone}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-lumina-text-muted">{label}</p>
        <p className="truncate text-sm font-medium text-lumina-text">{value}</p>
      </div>
    </div>
  );
}

function formatLayerLimit(maxLayers: number) {
  return maxLayers === Infinity ? "無制限" : `${maxLayers} layers`;
}

function PlanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-lumina-text-muted">{label}</span>
      <span className="font-medium text-lumina-text">{value}</span>
    </div>
  );
}
