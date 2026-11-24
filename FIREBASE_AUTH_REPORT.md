# Firebase Authentication 実装レポート（2026-11-25）

## 結論

ログインを Firebase Authentication で新規実装しました（従来計画の Supabase Auth は未実装だったため、置き換えではなく新規実装です）。`npm run build` は成功しています。ただし Firebase プロジェクトはまだ作成していないため、実際にログインできるようにするには、下記の「ユーザーがやること」（Firebase コンソールでの設定）が必要です。設定が終わるまでは、アプリは「認証未設定」として正常に動作し、エディターはログインなしで使えます。

作業ブランチ：`firebase-auth`（ローカルにコミット済み。GitHub へは push していません）

## 実装したもの

- **Firebase 初期化**（`src/lib/firebase.ts`）
  - 公式 `firebase` JS SDK を使用。設定は環境変数 `NEXT_PUBLIC_FIREBASE_*` からのみ読み込み、実値はコードに含めていません。
  - 環境変数が未設定の場合は `auth` が `null` になり、アプリはクラッシュせず「認証未設定」として動作します。
- **認証の仕組み**（`src/lib/auth.tsx`）
  - `AuthProvider`（React Context）と `useAuth` フック。現在のユーザー、読み込み状態、ログイン／ログアウトを提供します。
  - 対応するログイン方法：Google ログイン、メールアドレス＋パスワード（新規登録も同じ画面から可能）。
  - Firebase の認証エラーを日本語メッセージに変換する処理つき。
- **ログイン画面**（`src/app/login/page.tsx`、ルート `/login`）
  - 既存の Adobe 風ダークUI（lumina テーマ）に合わせたデザイン。
  - 未設定のときは「認証はまだ設定されていません」と案内を表示します。
- **ハブヘッダーのアカウント表示**（`src/components/hub/AuthButton.tsx`、`HubHeader.tsx` を改修）
  - 未ログイン時は「ログイン」ボタン、ログイン中はアバター／名前とメニュー（メールアドレス表示・ログアウト）を表示します。
  - `src/app/layout.tsx` で全体を `AuthProvider` で包みました。
- **全ページへのログイン必須化はしていません。** ログインは将来のクラウド同期のためのもので、エディターは今まで通りログインなしで使えます。フリーミアム制限も再有効化していません。

## 変更・追加したファイル

| ファイル | 内容 |
|---|---|
| `package.json` / `package-lock.json` | `firebase` を依存に追加 |
| `src/lib/firebase.ts` | 新規。Firebase 初期化（環境変数のみ） |
| `src/lib/auth.tsx` | 新規。AuthProvider / useAuth / エラー日本語化 |
| `src/app/login/page.tsx` | 新規。ログイン・アカウント作成画面 |
| `src/components/hub/AuthButton.tsx` | 新規。ヘッダーのログイン状態表示 |
| `src/components/hub/HubHeader.tsx` | アカウントボタンを AuthButton に差し替え |
| `src/app/layout.tsx` | AuthProvider を追加 |
| `.env.local.example` | 新規。`NEXT_PUBLIC_FIREBASE_*` の一覧（`.gitignore` に例外も追加） |
| `README.md` | 環境変数表を Firebase 用に差し替え、ロードマップ 8 を「ユーザー認証（Firebase Authentication）」として完了に更新 |

### ついでに直した既存の不具合（認証とは無関係）

`main` の時点でビルドが通らない状態だったため、ビルドを通すのに必要な最小限の修正だけ入れました。

- `src/components/editor/VideoEditor.tsx`：タブ切り替え部分の括弧の余分と、文字化けで壊れていた「音声トラックがありません」の表示を修正（2か所）。
- `src/components/editor/MotionEditor.tsx`：未インポートだった lucide アイコン（Film / Trash2 / Sliders）を追加。
- `src/components/editor/PropertiesPanel.tsx` / `LayersPanel.tsx`：オプショナルなハンドラ呼び出しに `?.` を追加（型エラー3件）。

## ビルド結果

- `npm install`：成功（`firebase` を追加）。
- `npm run build`：**成功**。全21ルート生成、`/login` も含まれます。TypeScript チェックも通過。
- `npx eslint`（変更ファイルのみ）：エラーなし。

## ユーザーがやること（Firebase コンソール）

1. https://console.firebase.google.com を開き、Google アカウントでログインする。
2. 「プロジェクトを追加」から新規プロジェクトを作成する（名前は任意。Google アナリティクスは任意でオフでも可）。
3. 左メニューの「構築」→「Authentication」を開き、「始める」を押す。
4. 「Sign-in method」タブで、以下2つを有効にする。
   - **Google**：有効にして、プロジェクトのサポートメールを選んで保存。
   - **メール / パスワード**：有効にして保存。
5. プロジェクトの概要画面で「ウェブ」アプリ（`</>` アイコン）を追加し、アプリを登録する（ニックネームは任意。「Firebase Hosting も設定する」はチェック不要）。
6. 表示される `firebaseConfig` の値を控える。
7. 控えた値を環境変数として設定する。
   - ローカル開発：プロジェクト直下に `.env.local` を作り、`.env.local.example` の項目に値を入れる。
   - 本番（Netlify）：Netlify Dashboard → Site configuration → Environment variables に同じ変数名で登録し、再デプロイする。
   - 対応表：`apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`、`authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`、`projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`、`storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`、`messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`、`appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`。
8. （本番で Google ログインを使う場合）Firebase コンソールの Authentication → Settings → 承認済みドメインに、Netlify のサイトのドメインが含まれていることを確認する（`localhost` と `*.firebaseapp.com` は最初から入っています）。

設定後に再ビルド／再デプロイすれば、`/login` から Google ログインとメール＋パスワードのログインが使えるようになります。

## 残っていること

- クラウド同期・リモートファイル管理は未実装（ロードマップ 9 のまま）。ログインはその土台として入れた段階です。
- GitHub への push、Netlify へのデプロイはしていません。
