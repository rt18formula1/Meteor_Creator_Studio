"use client";

import type { MeteorProject } from "@/lib/editor/document";

const STORAGE_KEY = "editional-recent-projects";

export function saveRecentProject(project: MeteorProject) {
  const list = getRecentProjects().filter((p) => p.name !== project.name);
  list.unshift({ name: project.name, updatedAt: project.updatedAt });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 8)));
}

export function getRecentProjects(): { name: string; updatedAt: string }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
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
