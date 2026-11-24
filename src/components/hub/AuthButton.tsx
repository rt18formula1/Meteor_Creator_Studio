"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LogIn, LogOut, User } from "lucide-react";

/**
 * ハブヘッダー右側のアカウント表示。
 * - 未ログイン: 「ログイン」ボタン（/login へ）
 * - ログイン中: アバター／名前と、クリックで開くメニュー（メールアドレス・ログアウト）
 * - Firebase 未設定: 「ログイン（未設定）」と表示し、/login で案内する
 */
export function AuthButton() {
  const { user, loading, configured, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (loading) {
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-lumina-text-muted">
        <User className="h-4 w-4 animate-pulse" />
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-full bg-lumina-bg-hover px-3 py-1 text-xs font-medium text-lumina-text transition hover:bg-lumina-border"
        title={configured ? "ログイン" : "ログイン（Firebase 未設定）"}
      >
        <LogIn className="h-3.5 w-3.5" />
        ログイン
      </Link>
    );
  }

  const label = user.displayName ?? user.email ?? "アカウント";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 transition hover:bg-lumina-bg-hover"
        aria-label="アカウントメニュー"
        title={label}
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lumina-accent text-[11px] font-bold text-white">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-28 truncate text-xs text-lumina-text lg:inline">
          {label}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-lumina-border bg-lumina-bg-elevated p-2 shadow-xl">
          <div className="px-2 py-1.5">
            <p className="truncate text-xs font-medium text-lumina-text">
              {user.displayName ?? "ログイン中"}
            </p>
            {user.email && (
              <p className="truncate text-[11px] text-lumina-text-muted">
                {user.email}
              </p>
            )}
          </div>
          <div className="my-1 border-t border-lumina-border" />
          <button
            type="button"
            onClick={async () => {
              setMenuOpen(false);
              await signOut();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-lumina-text transition hover:bg-lumina-bg-hover"
          >
            <LogOut className="h-3.5 w-3.5" />
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
