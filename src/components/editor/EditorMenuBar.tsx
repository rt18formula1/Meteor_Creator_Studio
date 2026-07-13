"use client";

import Link from "next/link";
import { useSubscription } from "@/store/use-subscription";
import { useEditorBridge } from "@/store/use-editor-bridge";
import {
  ArrowLeft,
  Bot,
  Download,
  FileImage,
  FolderOpen,
  HelpCircle,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";

type EditorMenuBarProps = {
  onNew: () => void;
  onOpen: () => void;
  onOpenProject: () => void;
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function EditorMenuBar({
  onNew,
  onOpen,
  onOpenProject,
  onSave,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditorMenuBarProps) {
  const tier = useSubscription((s) => s.tier);
  const projectName = useEditorBridge((s) => s.projectName);
  const showAgentPanel = useEditorBridge((s) => s.showAgentPanel);
  const setShowAgentPanel = useEditorBridge((s) => s.setShowAgentPanel);
  const setShowShortcuts = useEditorBridge((s) => s.setShowShortcuts);

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-lumina-border bg-lumina-toolbar px-2">
      <div className="flex items-center gap-1">
        <Link
          href="/"
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          CC
        </Link>
        <span className="mx-1 text-lumina-border">|</span>
        <span className="px-2 text-xs font-medium text-lumina-text">
          Editional Photo
        </span>
        <span className="max-w-32 truncate text-[10px] text-lumina-text-muted">
          — {projectName}
        </span>
        <span className="text-[10px] text-lumina-text-muted">
          {tier === "free" ? "（無料版）" : "（Pro）"}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <MenuButton icon={<FileImage className="h-3.5 w-3.5" />} label="新規" onClick={onNew} />
        <MenuButton icon={<FolderOpen className="h-3.5 w-3.5" />} label="画像を開く" onClick={onOpen} />
        <MenuButton icon={<FolderOpen className="h-3.5 w-3.5" />} label="プロジェクト" onClick={onOpenProject} />
        <MenuButton icon={<Save className="h-3.5 w-3.5" />} label="保存" onClick={onSave} />
        <span className="mx-1 text-lumina-border">|</span>
        <MenuButton
          icon={<Undo2 className="h-3.5 w-3.5" />}
          label="元に戻す"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <MenuButton
          icon={<Redo2 className="h-3.5 w-3.5" />}
          label="やり直し"
          onClick={onRedo}
          disabled={!canRedo}
        />
        <span className="mx-1 text-lumina-border">|</span>
        <MenuButton
          icon={<Download className="h-3.5 w-3.5" />}
          label="書き出し"
          onClick={onExport}
          accent
        />
        <MenuButton
          icon={<Bot className="h-3.5 w-3.5" />}
          label="AI Agent"
          onClick={() => setShowAgentPanel(!showAgentPanel)}
          accent={showAgentPanel}
        />
        <MenuButton
          icon={<HelpCircle className="h-3.5 w-3.5" />}
          label="ショートカット"
          onClick={() => setShowShortcuts(true)}
        />
      </div>
    </header>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
        disabled
          ? "cursor-not-allowed text-lumina-text-muted/40"
          : accent
            ? "bg-lumina-accent/20 text-lumina-accent hover:bg-lumina-accent/30"
            : "text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
      }`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
