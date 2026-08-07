"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, X, Trash2, ExternalLink, Clock, Copy, Search, Plus } from "lucide-react";
import {
  deleteCloudProject,
  duplicateCloudProject,
  getCloudProjectView,
  getCloudProjects,
  upsertCloudProject,
  type CloudProject,
} from "@/lib/editor/recent-projects";
import { CREATIVE_APPS } from "@/lib/apps";

interface ProjectBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAppId?: string;
}

function formatUpdatedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "たった今";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}時間前`;
  return d.toLocaleString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjectBrowserModal({
  isOpen,
  onClose,
  defaultAppId,
}: ProjectBrowserModalProps) {
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = () => setProjects(getCloudProjects());

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen]);

  if (!isOpen) return null;

  const views = projects
    .map(getCloudProjectView)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.appName.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const createProject = (appId: string) => {
    const app = CREATIVE_APPS.find((a) => a.id === appId);
    upsertCloudProject({
      name: `無題の${app?.shortName ?? "プロジェクト"}`,
      appId,
    });
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-lumina-border bg-lumina-bg-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-lumina-border bg-lumina-toolbar p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-lumina-accent/30 bg-lumina-accent/20 text-lumina-accent">
              <Folder className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-lumina-text">
                クラウドプロジェクトブラウザ
              </h2>
              <p className="text-[10px] text-lumina-text-muted">
                端末に保存したプロジェクトを横断管理（ローカル同期）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-lumina-border/60 bg-lumina-bg p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-lumina-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="プロジェクト名やアプリ名で検索..."
              className="w-full rounded-xl border border-lumina-border bg-lumina-bg-panel py-2 pl-9 pr-4 text-xs text-lumina-text outline-none placeholder:text-lumina-text-muted/60 focus:border-lumina-accent"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(defaultAppId
              ? CREATIVE_APPS.filter((a) => a.id === defaultAppId || a.status === "available")
              : CREATIVE_APPS.filter((a) => a.status === "available")
            )
              .slice(0, 6)
              .map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => createProject(app.id)}
                  className="flex items-center gap-1 rounded-full border border-lumina-border bg-lumina-bg-panel px-2.5 py-1 text-[10px] text-lumina-text-muted transition hover:border-lumina-accent/50 hover:text-lumina-text"
                >
                  <Plus className="h-3 w-3" />
                  {app.shortName}
                </button>
              ))}
          </div>
        </div>

        <div className="lumina-scrollbar grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
          {views.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-lumina-text-muted">
              プロジェクトがありません。上のボタンから新規作成するか、エディターで保存してください。
            </div>
          ) : (
            views.map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between rounded-xl border border-lumina-border/60 bg-lumina-bg-panel/60 p-3.5 transition hover:border-lumina-accent/50 hover:bg-lumina-bg-panel"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white shadow"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.appShortName}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-lumina-text-muted">
                      <Clock className="h-3 w-3" />
                      {formatUpdatedAt(p.updatedAt)}
                    </span>
                  </div>
                  <h3 className="mb-1 truncate text-xs font-semibold text-lumina-text">
                    {p.name}
                  </h3>
                  <span className="text-[10px] text-lumina-text-muted">{p.appName}</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-lumina-border/40 pt-2.5 text-xs">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        duplicateCloudProject(p.id);
                        refresh();
                      }}
                      className="rounded p-1 text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
                      title="複製"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteCloudProject(p.id);
                        refresh();
                      }}
                      className="rounded p-1 text-lumina-text-muted hover:bg-red-500/10 hover:text-red-400"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Link
                    href={p.href}
                    onClick={onClose}
                    className="flex items-center gap-1 text-[11px] font-medium text-lumina-accent hover:underline"
                  >
                    <span>開く</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
