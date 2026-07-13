# Editional Creative Cloud

Adobe Creative Cloud のフリーミアム代替。Canva のようなテンプレート型ではなく、**プロ向けのレイヤー・ツール・パネル構成**を採用しています。

## コンセプト

| | Adobe CC | Canva | Editional CC |
|---|---|---|---|
| ターゲット | プロ | 一般ユーザー | プロ〜中級者 |
| UI | パネル・ツールバー | テンプレート・ドラッグ | Adobe風パネル |
| 価格 | ¥7,480/月〜 | 無料〜 | 無料 / ¥1,480/月 |
| 学習曲線 | 高い | 低い | 中〜高 |

## アプリ構成

- **Editional Photo** — ラスター画像編集（MVP、利用可能）
- **Editional Vector** — ベクターグラフィック（近日公開）
- **Editional Video** — 動画編集（近日公開）
- **Editional Layout** — 組版（近日公開）
- **Editional Audio** — オーディオ編集（近日公開）

## フリーミアム制限

### 無料版
- レイヤー 5枚まで
- キャンバス 1920×1080 まで
- PNG / JPEG エクスポート（ウォーターマーク付き）
- クラウド 2GB
- 基本ツール

### Pro（¥1,480/月）
- レイヤー無制限
- キャンバス 16384px まで
- 全フォーマット、ウォーターマークなし
- クラウド 100GB
- AI機能、高度なフィルター、バッチエクスポート

## 開発

```bash
npm install
npm run dev
```

http://localhost:3000 で Creative Cloud ハブが開きます。

## Netlify へのデプロイ

このプロジェクトは **Netlify** 向けに設定済みです（`netlify.toml`）。

### 方法1: Git 連携（推奨）

1. GitHub / GitLab / Bitbucket にリポジトリを push
2. [Netlify Dashboard](https://app.netlify.com/) → **Add new site** → **Import an existing project**
3. リポジトリを選択（ビルド設定は自動検出されます）
4. **Deploy site** をクリック

ビルド設定（自動検出される内容）:

| 項目 | 値 |
|---|---|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node.js | 20 |

### 方法2: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init        # 新規サイト作成 or 既存サイトにリンク
netlify deploy --prod
```

### 環境変数（将来の機能用）

Netlify Dashboard → **Site configuration** → **Environment variables** で設定します。

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 認証・クラウド同期 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase クライアント |
| `STRIPE_SECRET_KEY` | Pro プラン決済（サーバー側） |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe クライアント |

`NEXT_PUBLIC_` 付きの変数はビルド時に埋め込まれるため、変更後は再デプロイが必要です。

## 技術スタック

- **Next.js 16** — アプリシェル・ルーティング
- **Fabric.js** — キャンバス画像編集エンジン
- **Zustand** — 状態管理（プラン・エディター）
- **Tailwind CSS** — Adobe風ダークUI
- **Netlify** — ホスティング（OpenNext アダプター）

## Agent API（外部AI連携）

Manus 等の外部AIエージェント向け REST API を提供しています。

- 開発者ページ: `/developers`
- エージェントガイド: `AGENTS.md`
- OpenAPI: `/api/v1/openapi`
- ツール定義: `/api/v1/tools`

```bash
curl -X POST https://your-site.netlify.app/api/v1/photo/execute \
  -H "Content-Type: application/json" \
  -d '{"canvas":{...},"commands":[{"type":"add_text","text":"Hello","x":100,"y":100}]}'
```

Netlify の環境変数に `EDITIONAL_AGENT_API_KEY` を設定すると API キー認証が有効になります。

## ロードマップ

1. [x] Creative Cloud ハブ（ランチャー）
2. [x] Editional Photo MVP（レイヤー、ブラシ、図形、テキスト、書き出し）
3. [x] フリーミアム制限（レイヤー数、ウォーターマーク）
4. [x] Agent REST API（Manus 等の外部AI連携）
5. [x] プロジェクト保存（`.editional.json`）
6. [ ] ユーザー認証（Supabase Auth）
7. [ ] クラウド同期・ファイル管理
8. [ ] Stripe 決済連携
9. [ ] Editional Vector（SVG エディター）
10. [ ] PSD / AI ファイル互換

## ライセンス

MIT
