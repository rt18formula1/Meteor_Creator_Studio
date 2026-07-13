"use client";

import Link from "next/link";
import { HubHeader } from "@/components/hub/HubHeader";
import { PLAN_LIMITS, PRICING } from "@/lib/freemium";
import { useSubscription } from "@/store/use-subscription";
import { Check, X } from "lucide-react";

export default function PricingPage() {
  const { tier, setTier } = useSubscription();

  return (
    <div className="flex h-full flex-col">
      <HubHeader />
      <main className="lumina-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-semibold">プランを選択</h1>
            <p className="mt-2 text-sm text-lumina-text-muted">
              Adobe CCの約1/5の価格で、プロ向けワークフローを提供します。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PricingCard
              name="無料"
              price={PRICING.free.label}
              description="個人の学習・軽い制作向け"
              current={tier === "free"}
              onSelect={() => setTier("free")}
              features={[
                { label: "レイヤー5枚まで", included: true },
                { label: "キャンバス 1920×1080まで", included: true },
                { label: "PNG / JPEG エクスポート", included: true },
                { label: "クラウド 2GB", included: true },
                { label: "基本ツール一式", included: true },
                { label: "エクスポート時ウォーターマーク", included: false },
                { label: "AI生成・背景除去", included: false },
                { label: "バッチエクスポート", included: false },
              ]}
            />
            <PricingCard
              name="Pro"
              price={PRICING.pro.label}
              description="プロフェッショナル制作向け"
              highlighted
              current={tier === "pro"}
              onSelect={() => setTier("pro")}
              features={[
                { label: "レイヤー無制限", included: true },
                {
                  label: `キャンバス ${PLAN_LIMITS.pro.maxCanvasWidth.toLocaleString()}pxまで`,
                  included: true,
                },
                { label: "全フォーマット対応", included: true },
                { label: "クラウド 100GB", included: true },
                { label: "全ツール + 高度なフィルター", included: true },
                { label: "ウォーターマークなし", included: true },
                { label: "AI生成・背景除去", included: true },
                { label: "バッチエクスポート", included: true },
              ]}
            />
          </div>

          <p className="mt-8 text-center text-xs text-lumina-text-muted">
            ※ デモ用の切り替えです。本番ではStripe等の決済連携を実装します。
          </p>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-lumina-accent hover:underline"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
  current,
  onSelect,
}: {
  name: string;
  price: string;
  description: string;
  features: { label: string; included: boolean }[];
  highlighted?: boolean;
  current: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlighted
          ? "border-lumina-pro/50 bg-gradient-to-b from-lumina-pro/10 to-transparent"
          : "border-lumina-border bg-lumina-bg-elevated"
      }`}
    >
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="mt-1 text-2xl font-bold">{price}</p>
      <p className="mt-1 text-xs text-lumina-text-muted">{description}</p>

      <ul className="mt-6 space-y-2">
        {features.map((f) => (
          <li key={f.label} className="flex items-center gap-2 text-xs">
            {f.included ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-lumina-success" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0 text-lumina-text-muted" />
            )}
            <span
              className={
                f.included ? "text-lumina-text" : "text-lumina-text-muted"
              }
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        disabled={current}
        className={`mt-6 w-full rounded-lg py-2.5 text-sm font-medium transition ${
          current
            ? "cursor-default bg-lumina-bg-panel text-lumina-text-muted"
            : highlighted
              ? "bg-lumina-pro text-white hover:bg-lumina-pro/90"
              : "bg-lumina-accent text-white hover:bg-lumina-accent-hover"
        }`}
      >
        {current ? "現在のプラン" : `${name}を選択`}
      </button>
    </div>
  );
}
