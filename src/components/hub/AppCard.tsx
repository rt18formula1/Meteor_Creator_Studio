import Link from "next/link";
import type { CreativeApp } from "@/lib/types";
import { ArrowRight, Clock } from "lucide-react";

export function AppCard({ app }: { app: CreativeApp }) {
  const isAvailable = app.status === "available";

  const content = (
    <div
      className={`group relative flex h-44 flex-col overflow-hidden rounded-lg border transition ${
        isAvailable
          ? "cursor-pointer border-lumina-border bg-lumina-bg-elevated hover:border-lumina-accent/50 hover:shadow-lg hover:shadow-lumina-accent/5"
          : "cursor-default border-lumina-border/50 bg-lumina-bg-elevated/50 opacity-70"
      }`}
    >
      <div
        className="flex h-24 items-center justify-center"
        style={{ backgroundColor: app.accentColor }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white shadow-lg"
          style={{ backgroundColor: app.iconColor }}
        >
          {app.shortName}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-lumina-text">{app.name}</h3>
            {!isAvailable && (
              <span className="flex items-center gap-1 text-[10px] text-lumina-text-muted">
                <Clock className="h-3 w-3" />
                近日公開
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-lumina-text-muted">
            {app.description}
          </p>
        </div>
        {isAvailable && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-lumina-accent opacity-0 transition group-hover:opacity-100">
            開く
            <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );

  if (isAvailable) {
    return <Link href={app.href}>{content}</Link>;
  }

  return content;
}
