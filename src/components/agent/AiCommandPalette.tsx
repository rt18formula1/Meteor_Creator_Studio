"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Command, X, Bot, Zap, Loader2 } from "lucide-react";

interface AiCommandPaletteProps {
  appName: string;
  onExecuteCommand?: (commandText: string) => Promise<string> | string | void;
  isOpen: boolean;
  onClose: () => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "赤色の四角形を追加",
  "テキストを追加",
  "不透明度を 50% に変更",
  "新規レイヤーを作成",
];

export function AiCommandPalette({
  appName,
  onExecuteCommand,
  isOpen,
  onClose,
  suggestions = DEFAULT_SUGGESTIONS,
}: AiCommandPaletteProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: `こんにちは！Editional AI アシスタントです。${appName} に対する指示を入力してください（例: 「赤色のオブジェクトを追加」「テキストを追加」）。`,
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isProcessing]);

  const runCommand = async (userText: string) => {
    if (!userText.trim() || isProcessing) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsProcessing(true);

    try {
      let result = `「${userText}」を受け付けました。`;
      if (onExecuteCommand) {
        const out = await onExecuteCommand(userText);
        if (typeof out === "string" && out.trim()) result = out;
      } else {
        await new Promise((r) => setTimeout(r, 400));
        result = `「${userText}」のデモ応答です。このアプリではまだキャンバス操作が接続されていません。`;
      }
      setMessages((prev) => [...prev, { role: "ai", text: result }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: err instanceof Error ? `エラー: ${err.message}` : "コマンドの実行に失敗しました。",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runCommand(input.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-20 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-lumina-border bg-lumina-bg-elevated/95 shadow-2xl backdrop-blur-md">
        <form
          onSubmit={handleSubmit}
          className="flex items-center border-b border-lumina-border bg-lumina-toolbar px-4 py-3"
        >
          <Sparkles className="mr-3 h-5 w-5 shrink-0 animate-pulse text-lumina-accent" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${appName} への AI 指示を入力...`}
            className="flex-1 bg-transparent text-sm text-lumina-text outline-none placeholder:text-lumina-text-muted/60"
            disabled={isProcessing}
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden items-center gap-1 rounded border border-lumina-border bg-lumina-bg-panel px-2 py-0.5 font-mono text-[10px] text-lumina-text-muted sm:inline-flex">
              <Command className="h-3 w-3" /> K
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div ref={listRef} className="lumina-scrollbar max-h-72 space-y-3 overflow-y-auto p-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "ai" && (
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lumina-accent to-[#7c3aed] text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2 leading-relaxed ${
                  m.role === "user"
                    ? "bg-lumina-accent font-medium text-white"
                    : "border border-lumina-border/60 bg-lumina-bg-panel text-lumina-text"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 py-1 text-xs text-lumina-accent">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI が指示を解析してコマンドを実行中...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto border-t border-lumina-border bg-lumina-toolbar/80 px-4 py-2.5 text-xs">
          <Zap className="h-3.5 w-3.5 shrink-0 text-lumina-pro" />
          <span className="shrink-0 text-[10px] font-medium text-lumina-text-muted">
            試してみる:
          </span>
          <div className="lumina-scrollbar flex items-center gap-1.5 overflow-x-auto">
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => void runCommand(sug)}
                disabled={isProcessing}
                className="whitespace-nowrap rounded-full border border-lumina-border/60 bg-lumina-bg-panel px-2.5 py-1 text-[11px] text-lumina-text-muted transition hover:border-lumina-accent/50 hover:text-lumina-accent disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
