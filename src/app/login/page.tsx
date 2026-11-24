"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth, authErrorMessage } from "@/lib/auth";
import { Loader2, Settings2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, configured, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.replace("/");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-lumina-bg">
      <header className="flex h-12 shrink-0 items-center border-b border-lumina-border bg-lumina-toolbar px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-lumina-accent to-[#7c3aed] text-xs font-bold text-white">
            E
          </div>
          <span className="text-sm font-semibold tracking-tight text-lumina-text">
            Meteor Creator Studio
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-10">
        <div className="w-full max-w-sm rounded-xl border border-lumina-border bg-lumina-bg-elevated p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-lumina-text">
            {mode === "signin" ? "ログイン" : "アカウント作成"}
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-lumina-text-muted">
            ログインすると、今後追加されるクラウド同期などが使えるようになります。
            ログインしなくても、すべてのエディターはそのまま使えます。
          </p>

          {!configured ? (
            <div className="mt-6 rounded-lg border border-lumina-border bg-lumina-bg-panel p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-lumina-text">
                <Settings2 className="h-4 w-4" />
                認証はまだ設定されていません
              </p>
              <p className="mt-2 text-xs leading-relaxed text-lumina-text-muted">
                Firebase の環境変数（NEXT_PUBLIC_FIREBASE_*）が未設定のため、
                ログイン機能は無効になっています。設定方法は README と
                .env.local.example を参照してください。エディターはログインなしで
                引き続き使えます。
              </p>
              <Link
                href="/"
                className="mt-4 inline-block rounded bg-lumina-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-lumina-accent-hover"
              >
                ホームに戻る
              </Link>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-white px-4 py-2.5 text-sm font-medium text-[#1f1f1f] transition hover:bg-neutral-200 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Google でログイン
              </button>

              <div className="my-5 flex items-center gap-3 text-[11px] text-lumina-text-muted">
                <span className="h-px flex-1 bg-lumina-border" />
                または
                <span className="h-px flex-1 bg-lumina-border" />
              </div>

              <form onSubmit={handleEmail} className="space-y-3">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-xs text-lumina-text-muted"
                  >
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-lumina-border bg-lumina-bg px-3 py-2 text-sm text-lumina-text outline-none transition focus:border-lumina-accent"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-xs text-lumina-text-muted"
                  >
                    パスワード
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded border border-lumina-border bg-lumina-bg px-3 py-2 text-sm text-lumina-text outline-none transition focus:border-lumina-accent"
                    placeholder="6文字以上"
                  />
                </div>

                {error && (
                  <p className="rounded bg-lumina-danger/15 px-3 py-2 text-xs text-lumina-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded bg-lumina-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-lumina-accent-hover disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "signin" ? "ログイン" : "アカウントを作成"}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-lumina-text-muted">
                {mode === "signin" ? (
                  <>
                    アカウントをお持ちでない方は{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                      }}
                      className="text-lumina-accent hover:underline"
                    >
                      アカウント作成
                    </button>
                  </>
                ) : (
                  <>
                    すでにアカウントをお持ちの方は{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setError(null);
                      }}
                      className="text-lumina-accent hover:underline"
                    >
                      ログイン
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.58v2.97h3.87c2.26-2.09 3.57-5.16 3.57-8.74z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-2.97c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.07A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.31A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.58.38-2.31V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.07z"
      />
      <path
        fill="#EA4335"
        d="M12 4.73c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.07C6.22 6.84 8.87 4.73 12 4.73z"
      />
    </svg>
  );
}
