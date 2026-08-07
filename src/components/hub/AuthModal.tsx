"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/use-auth";
import { Loader2, X, LogIn, UserPlus } from "lucide-react";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const configured = useAuth((s) => s.configured);
  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setInfo(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const err =
        mode === "signin"
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password);
      if (err) {
        setError(err);
        return;
      }
      if (mode === "signup") {
        setInfo("確認メールを送信しました（設定による）。ログインできる場合はそのまま続行できます。");
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-lumina-border bg-lumina-bg-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-lumina-border bg-lumina-toolbar px-4 py-3">
          <div className="flex items-center gap-2">
            {mode === "signin" ? (
              <LogIn className="h-4 w-4 text-lumina-accent" />
            ) : (
              <UserPlus className="h-4 w-4 text-lumina-accent" />
            )}
            <h2 className="text-sm font-semibold text-lumina-text">
              {mode === "signin" ? "ログイン" : "アカウント作成"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-lumina-text-muted hover:bg-lumina-bg-hover hover:text-lumina-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {!configured && (
            <div className="rounded-lg border border-lumina-pro/40 bg-lumina-pro/10 p-3 text-[11px] leading-relaxed text-lumina-text">
              Supabase 未設定です。`.env.local` に
              `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`
              を追加すると認証が有効になります。
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] text-lumina-text-muted">メール</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-lumina-border bg-lumina-bg-panel px-3 py-2 text-sm text-lumina-text outline-none focus:border-lumina-accent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-lumina-text-muted">パスワード</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-lumina-border bg-lumina-bg-panel px-3 py-2 text-sm text-lumina-text outline-none focus:border-lumina-accent"
                placeholder="6文字以上"
              />
            </div>

            {error && (
              <p className="rounded bg-lumina-danger/10 px-2 py-1.5 text-[11px] text-lumina-danger">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded bg-lumina-success/10 px-2 py-1.5 text-[11px] text-lumina-success">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !configured}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-lumina-accent py-2 text-sm font-medium text-white transition hover:bg-lumina-accent-hover disabled:opacity-40"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "ログイン" : "登録"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-center text-[11px] text-lumina-text-muted hover:text-lumina-accent"
          >
            {mode === "signin"
              ? "アカウントをお持ちでない方はこちら"
              : "すでにアカウントがある方はログイン"}
          </button>
        </div>
      </div>
    </div>
  );
}
