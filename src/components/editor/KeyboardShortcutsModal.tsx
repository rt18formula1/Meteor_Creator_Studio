"use client";

import { useState, useEffect } from "react";
import { useEditorBridge } from "@/store/use-editor-bridge";
import { useShortcutsStore, formatShortcut, type ShortcutAction } from "@/store/use-shortcuts-store";
import { X, RotateCcw, Keyboard, AlertTriangle, Check } from "lucide-react";

export function KeyboardShortcutsModal() {
  const show = useEditorBridge((s) => s.showShortcuts);
  const setShow = useEditorBridge((s) => s.setShowShortcuts);

  const { shortcuts, updateShortcut, resetToDefault } = useShortcutsStore();

  const [editingAction, setEditingAction] = useState<ShortcutAction | null>(null);
  const [conflictWarning, setConflictWarning] = useState<{
    actionName: string;
    keyString: string;
  } | null>(null);

  // キー入力をキャプチャするリスナー
  useEffect(() => {
    if (!editingAction) return;

    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape はキャンセル
      if (e.key === "Escape") {
        setEditingAction(null);
        setConflictWarning(null);
        return;
      }

      // 修飾キー単体はスルー
      const isModifierOnly = ["Control", "Shift", "Alt", "Meta"].includes(e.key);
      if (isModifierOnly) return;

      const rawKey = e.key.toLowerCase();
      // 特殊なキー（F1-F12, Backspace, Delete など）も許容するが、アルファベットや数字、記号をメインにする
      // e.key が空や undefined の場合は処理しない
      if (!rawKey) return;

      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // 競合チェック
      let conflictingAction: any = null;
      Object.values(shortcuts).forEach((s) => {
        if (
          s.action !== editingAction &&
          s.key === rawKey &&
          s.ctrlOrMeta === ctrlOrMeta &&
          s.shift === shift &&
          s.alt === alt
        ) {
          conflictingAction = s;
        }
      });

      // 競合がある場合、警告を出して一時保留する
      if (conflictingAction) {
        const formattedKey = formatShortcut({
          action: editingAction,
          name: "",
          key: rawKey,
          ctrlOrMeta,
          shift,
          alt,
        });
        setConflictWarning({
          actionName: conflictingAction.name,
          keyString: formattedKey,
        });

        // 競合上書きの処理：自動的に上書きして、古い方のバインドを外す
        // ここでは確認なしで自動的にスワップ/クリアを行う
        updateShortcut(conflictingAction.action, "", false, false, false);
      } else {
        setConflictWarning(null);
      }

      updateShortcut(editingAction, rawKey, ctrlOrMeta, shift, alt);
      setEditingAction(null);
    };

    window.addEventListener("keydown", handleCapture, true);
    return () => window.removeEventListener("keydown", handleCapture, true);
  }, [editingAction, shortcuts, updateShortcut]);

  // モーダルが閉じられたら編集状態をリセット
  useEffect(() => {
    if (!show) {
      setEditingAction(null);
      setConflictWarning(null);
    }
  }, [show]);

  if (!show) return null;

  const shortcutList = Object.values(shortcuts);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-lumina-border bg-lumina-bg-elevated/95 p-6 shadow-2xl backdrop-blur-md transition-all duration-300">
        
        {/* ヘッダー */}
        <div className="mb-5 flex items-center justify-between border-b border-lumina-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lumina-accent/15 text-lumina-accent">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-lumina-text">ショートカットのカスタマイズ</h2>
              <p className="text-[10px] text-lumina-text-muted">キーをクリックして新しい割り当てを入力できます</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="rounded-lg p-1.5 text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 競合アラート（トースト風） */}
        {conflictWarning && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200/90 animate-in slide-in-from-top-2 duration-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
            <div>
              <span className="font-semibold">{conflictWarning.keyString}</span> はすでに{" "}
              <span className="font-semibold">「{conflictWarning.actionName}」</span> に割り当てられていました。
              <p className="mt-0.5 text-[10px] text-yellow-400/80">※ 古い割り当ては解除され、新しく割り当てられました。</p>
            </div>
          </div>
        )}

        {/* ショートカットリスト */}
        <div className="lumina-scrollbar max-h-[380px] overflow-y-auto pr-1 space-y-1.5">
          {shortcutList.map((s) => {
            const isEditing = editingAction === s.action;
            const hasKey = s.key !== "";
            const keyDisplay = hasKey ? formatShortcut(s) : "未設定";

            return (
              <div
                key={s.action}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                  isEditing
                    ? "bg-lumina-accent/10 border border-lumina-accent/30"
                    : "bg-lumina-bg-panel/40 border border-transparent hover:bg-lumina-bg-hover/30"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-lumina-text">{s.name}</span>
                  <span className="text-[10px] text-lumina-text-muted">
                    {s.action.startsWith("select") ||
                    s.action.startsWith("brush") ||
                    s.action.startsWith("eraser") ||
                    s.action.startsWith("text") ||
                    s.action.startsWith("rectangle") ||
                    s.action.startsWith("ellipse") ||
                    s.action.startsWith("eyedropper")
                      ? "ツール選択"
                      : "システム操作"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingAction(s.action);
                    setConflictWarning(null);
                  }}
                  className={`min-w-[80px] rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-semibold border transition-all ${
                    isEditing
                      ? "bg-lumina-accent border-lumina-accent text-white animate-pulse"
                      : hasKey
                      ? "bg-lumina-bg-elevated border-lumina-border text-lumina-text hover:border-lumina-accent/60 hover:text-lumina-accent"
                      : "bg-lumina-bg-elevated border-lumina-border border-dashed text-lumina-text-muted hover:border-lumina-accent/60 hover:text-lumina-accent"
                  }`}
                >
                  {isEditing ? "入力待ち..." : keyDisplay}
                </button>
              </div>
            );
          })}
        </div>

        {/* フッター / アクション */}
        <div className="mt-5 flex items-center justify-between border-t border-lumina-border pt-4 text-xs">
          <button
            type="button"
            onClick={resetToDefault}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>デフォルトに戻す</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShow(false)}
            className="flex items-center gap-1 rounded-lg bg-lumina-accent px-4 py-2 font-semibold text-white shadow-lg shadow-lumina-accent/15 transition hover:bg-lumina-accent-hover"
          >
            <Check className="h-3.5 w-3.5" />
            <span>完了</span>
          </button>
        </div>

      </div>
    </div>
  );
}
