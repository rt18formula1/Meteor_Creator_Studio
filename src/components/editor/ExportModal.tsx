"use client";

import { useEditorBridge } from "@/store/use-editor-bridge";
import { useSubscription } from "@/store/use-subscription";
import { PLAN_LIMITS } from "@/lib/freemium";
import { X } from "lucide-react";

type ExportModalProps = {
  onExport: (format: "png" | "jpeg", quality?: number) => void;
};

export function ExportModal({ onExport }: ExportModalProps) {
  const show = useEditorBridge((s) => s.showExportModal);
  const setShow = useEditorBridge((s) => s.setShowExportModal);
  const tier = useSubscription((s) => s.tier);
  const limits = PLAN_LIMITS[tier];

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-lumina-border bg-lumina-bg-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-lumina-text">書き出し</h2>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="text-lumina-text-muted hover:text-lumina-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onExport("png");
              setShow(false);
            }}
            className="w-full rounded-lg border border-lumina-border bg-lumina-bg-panel px-4 py-3 text-left transition hover:border-lumina-accent"
          >
            <p className="text-sm font-medium text-lumina-text">PNG</p>
            <p className="text-[11px] text-lumina-text-muted">ロスレス、透明対応</p>
          </button>

          {limits.exportFormats.includes("jpeg") && (
            <button
              type="button"
              onClick={() => {
                onExport("jpeg", 0.92);
                setShow(false);
              }}
              className="w-full rounded-lg border border-lumina-border bg-lumina-bg-panel px-4 py-3 text-left transition hover:border-lumina-accent"
            >
              <p className="text-sm font-medium text-lumina-text">JPEG</p>
              <p className="text-[11px] text-lumina-text-muted">高品質 92%</p>
            </button>
          )}

          {limits.watermarkOnExport && (
            <p className="text-[10px] text-lumina-pro">
              無料版はウォーターマークが付きます。Proで解除できます。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
