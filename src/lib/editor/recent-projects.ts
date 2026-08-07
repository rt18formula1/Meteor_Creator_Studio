"use client";

import { CREATIVE_APPS } from "@/lib/apps";
import type { MeteorProject } from "@/lib/editor/document";

const STORAGE_KEY = "editional-cloud-projects";
const LEGACY_KEY = "editional-recent-projects";

export type CloudProject = {
  id: string;
  name: string;
  appId: string;
  updatedAt: string;
  createdAt: string;
};

function appMeta(appId: string) {
  const app = CREATIVE_APPS.find((a) => a.id === appId);
  return {
    appName: app?.name ?? appId,
    appShortName: app?.shortName ?? appId.slice(0, 2).toUpperCase(),
    color: app?.iconColor ?? "#1473e6",
    href: app?.href ?? `/apps/${appId}`,
  };
}

function readRaw(): CloudProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CloudProject[];

    // 旧形式からの移行
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return [];
    const old = JSON.parse(legacy) as { name: string; updatedAt: string }[];
    const migrated: CloudProject[] = old.map((p, i) => ({
      id: `migrated-${i}-${p.name}`,
      name: p.name,
      appId: "photo",
      updatedAt: p.updatedAt,
      createdAt: p.updatedAt,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return [];
  }
}

function writeRaw(projects: CloudProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 48)));
}

export function getCloudProjects(): CloudProject[] {
  return readRaw().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

/** @deprecated use getCloudProjects — hub 互換 */
export function getRecentProjects(): { name: string; updatedAt: string }[] {
  return getCloudProjects().map((p) => ({ name: p.name, updatedAt: p.updatedAt }));
}

export function getCloudProjectView(p: CloudProject) {
  return { ...p, ...appMeta(p.appId) };
}

export function upsertCloudProject(input: {
  id?: string;
  name: string;
  appId: string;
}): CloudProject {
  const now = new Date().toISOString();
  const list = readRaw();
  const id = input.id ?? `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const existing = list.findIndex((p) => p.id === id || (p.name === input.name && p.appId === input.appId));
  const next: CloudProject = {
    id,
    name: input.name,
    appId: input.appId,
    createdAt: existing >= 0 ? list[existing].createdAt : now,
    updatedAt: now,
  };
  if (existing >= 0) list.splice(existing, 1);
  list.unshift(next);
  writeRaw(list);
  return next;
}

export function saveRecentProject(project: MeteorProject) {
  upsertCloudProject({ name: project.name, appId: project.app ?? "photo" });
}

export function deleteCloudProject(id: string) {
  writeRaw(readRaw().filter((p) => p.id !== id));
}

export function duplicateCloudProject(id: string): CloudProject | null {
  const src = readRaw().find((p) => p.id === id);
  if (!src) return null;
  return upsertCloudProject({
    name: `${src.name} (コピー)`,
    appId: src.appId,
  });
}

export function downloadProject(project: MeteorProject) {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.replace(/\s+/g, "-")}.editional.json`;
  link.click();
  URL.revokeObjectURL(url);
}
