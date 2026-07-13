"use client";

import { useEditorBridge } from "@/store/use-editor-bridge";
import { X } from "lucide-react";

const SHORTCUTS = [
  { key: "V", action: "移動ツール" },
  { key: "B", action: "ブラシ" },
  { key: "E", action: "消しゴム" },
  { key: "T", action: "テキスト" },
  { key: "U", action: "矩形" },
  { key: "O", action: "楕円" },
  { key: "I", action: "スポイト" },
  { key: "Ctrl+Z", action: "元に戻す" },
  { key: "Ctrl+Shift+Z", action: "やり直し" },
  { key: "Ctrl+S", action: "保存" },
  { key: "Ctrl+E", action: "書き出し" },
];

export function KeyboardShortcutsModal() {
  const show = useEditorBridge((s) => s.showShortcuts);
  const setShow = useEditorBridge((s) => s.setShowShortcuts);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-lumina-border bg-lumina-bg-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-lumina-text">キーボードショートカット</h2>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="text-lumina-text-muted hover:text-lumina-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.key} className="flex items-center justify-between text-[11px]">
              <span className="text-lumina-text-muted">{s.action}</span>
              <kbd className="rounded bg-lumina-bg-panel px-2 py-0.5 font-mono text-lumina-text">
                {s.key}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
