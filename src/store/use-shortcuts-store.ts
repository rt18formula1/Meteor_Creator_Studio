"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShortcutAction =
  | "select"
  | "brush"
  | "eraser"
  | "text"
  | "rectangle"
  | "ellipse"
  | "eyedropper"
  | "undo"
  | "redo"
  | "save"
  | "export";

export interface Shortcut {
  action: ShortcutAction;
  name: string;
  key: string; // "v", "z", etc. (lowercase)
  ctrlOrMeta: boolean;
  shift: boolean;
  alt: boolean;
}

interface ShortcutsState {
  shortcuts: Record<ShortcutAction, Shortcut>;
  updateShortcut: (
    action: ShortcutAction,
    key: string,
    ctrlOrMeta: boolean,
    shift: boolean,
    alt: boolean
  ) => void;
  resetToDefault: () => void;
}

export const DEFAULT_SHORTCUTS: Record<ShortcutAction, Shortcut> = {
  select: { action: "select", name: "移動ツール", key: "v", ctrlOrMeta: false, shift: false, alt: false },
  brush: { action: "brush", name: "ブラシツール", key: "b", ctrlOrMeta: false, shift: false, alt: false },
  eraser: { action: "eraser", name: "消しゴムツール", key: "e", ctrlOrMeta: false, shift: false, alt: false },
  text: { action: "text", name: "テキストツール", key: "t", ctrlOrMeta: false, shift: false, alt: false },
  rectangle: { action: "rectangle", name: "矩形ツール", key: "u", ctrlOrMeta: false, shift: false, alt: false },
  ellipse: { action: "ellipse", name: "楕円ツール", key: "o", ctrlOrMeta: false, shift: false, alt: false },
  eyedropper: { action: "eyedropper", name: "スポイトツール", key: "i", ctrlOrMeta: false, shift: false, alt: false },
  undo: { action: "undo", name: "元に戻す", key: "z", ctrlOrMeta: true, shift: false, alt: false },
  redo: { action: "redo", name: "やり直し", key: "z", ctrlOrMeta: true, shift: true, alt: false },
  save: { action: "save", name: "保存", key: "s", ctrlOrMeta: true, shift: false, alt: false },
  export: { action: "export", name: "書き出し", key: "e", ctrlOrMeta: true, shift: false, alt: false },
};

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set) => ({
      shortcuts: { ...DEFAULT_SHORTCUTS },
      updateShortcut: (action, key, ctrlOrMeta, shift, alt) =>
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [action]: {
              ...state.shortcuts[action],
              key: key.toLowerCase(),
              ctrlOrMeta,
              shift,
              alt,
            },
          },
        })),
      resetToDefault: () => set({ shortcuts: { ...DEFAULT_SHORTCUTS } }),
    }),
    {
      name: "editional-shortcuts",
    }
  )
);

// キーボードイベントから人が読めるショートカットキー表示文字列を生成するヘルパー関数
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = [];
  const isMac = typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  if (shortcut.ctrlOrMeta) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }
  parts.push(shortcut.key.toUpperCase());
  return parts.join(isMac ? "" : "+");
}
