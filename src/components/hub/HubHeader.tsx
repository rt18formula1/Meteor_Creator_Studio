"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSubscription } from "@/store/use-subscription";
import { useAuth } from "@/store/use-auth";
import { ProjectBrowserModal } from "@/components/hub/ProjectBrowserModal";
import { AuthModal } from "@/components/hub/AuthModal";
import { Crown, Cloud, Bell, User, LogOut } from "lucide-react";

export function HubHeader() {
  const tier = useSubscription((s) => s.tier);
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const init = useAuth((s) => s.init);
  const signOut = useAuth((s) => s.signOut);
  const [showProjects, setShowProjects] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => init(), [init]);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-lumina-border bg-lumina-toolbar px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-lumina-accent to-[#7c3aed] text-xs font-bold text-white">
              E
            </div>
            <span className="text-sm font-semibold tracking-tight text-lumina-text">
              Meteor Creator Studio
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavTab href="/" active>
              ホーム
            </NavTab>
            <NavTab href="/apps/photo">アプリ</NavTab>
            <NavTab href="/developers">Agent API</NavTab>
            <NavTab href="/pricing">プラン</NavTab>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {tier === "free" && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 rounded-full bg-lumina-pro/15 px-3 py-1 text-xs font-medium text-lumina-pro transition hover:bg-lumina-pro/25"
            >
              <Crown className="h-3.5 w-3.5" />
              Proにアップグレード
            </Link>
          )}
          {tier === "pro" && (
            <span className="flex items-center gap-1 rounded-full bg-lumina-pro/20 px-2.5 py-1 text-xs font-medium text-lumina-pro">
              <Crown className="h-3 w-3" />
              Pro
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowProjects(true)}
            className="rounded p-1.5 text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            aria-label="クラウドプロジェクト"
            title="クラウドプロジェクト"
          >
            <Cloud className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
            aria-label="通知"
          >
            <Bell className="h-4 w-4" />
          </button>
          {user ? (
            <div className="flex items-center gap-1">
              <span
                className="hidden max-w-28 truncate text-[10px] text-lumina-text-muted sm:inline"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded p-1.5 text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text"
                aria-label="ログアウト"
                title="ログアウト"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              disabled={loading}
              className="rounded p-1.5 text-lumina-text-muted transition hover:bg-lumina-bg-hover hover:text-lumina-text disabled:opacity-40"
              aria-label="アカウント"
              title="ログイン"
            >
              <User className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
      <ProjectBrowserModal isOpen={showProjects} onClose={() => setShowProjects(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

function NavTab({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded px-3 py-1.5 text-xs transition ${
        active
          ? "bg-lumina-bg-hover text-lumina-text"
          : "text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
      }`}
    >
      {children}
    </Link>
  );
}
