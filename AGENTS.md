# Meteor Creator Studio — Agent Integration Guide

このドキュメントは **Manus** 等の外部AIエージェントが Meteor Photo を操作するためのガイドです。

## 設計思想

- **ステートレス**: サーバーはセッションを保持しません。キャンバス JSON を毎回送受信します。
- **MCP互換**: `/api/v1/tools` でツール定義を取得できます。
- **OpenAPI**: `/api/v1/openapi` で機械可読な仕様を提供します。

## ベース URL

```
https://your-site.netlify.app/api/v1
```

## 認証

`EDITIONAL_AGENT_API_KEY` が設定されている場合:

```http
X-Meteor-Api-Key: your-secret-key
```

または:

```http
Authorization: Bearer your-secret-key
```

## 推奨ワークフロー

### 1. 空キャンバスを取得

```http
GET /api/v1/photo/canvas?width=1920&height=1080
```

### 2. コマンドを実行

```http
POST /api/v1/photo/execute
Content-Type: application/json

{
  "tier": "free",
  "canvas": { ... },
  "commands": [
    { "type": "add_text", "text": "Hello", "x": 100, "y": 100, "fontSize": 48 },
    { "type": "add_rectangle", "x": 200, "y": 200, "width": 300, "height": 150, "fill": "#1473e6" },
    { "type": "list_layers" }
  ]
}
```

レスポンス:

```json
{
  "success": true,
  "canvas": { ... },
  "results": [{ "command": "add_text", "success": true, "message": "Text added", "layerId": "..." }],
  "layers": [{ "id": "...", "name": "テキスト", "type": "IText", "visible": true, "locked": false, "opacity": 1 }]
}
```

### 3. 返却された canvas を次のリクエストに使用

チェーンして複数ステップの編集が可能です。

## 利用可能コマンド

| type | 説明 |
|------|------|
| `add_text` | テキストレイヤー追加 |
| `add_rectangle` | 矩形追加 |
| `add_ellipse` | 楕円追加 |
| `remove_layer` | レイヤー削除 |
| `set_layer_visibility` | 表示切替 |
| `set_layer_opacity` | 不透明度 (0-1) |
| `rename_layer` | レイヤー名変更 |
| `set_background` | 背景色変更 |
| `clear_layers` | 背景以外を削除 |
| `apply_filter` | フィルター適用 (Pro) |
| `list_layers` | レイヤー一覧 |

各コマンドの JSON Schema は `GET /api/v1/tools` の `commands` 配列を参照してください。

## 高レベルエージェント API

プロンプトベースの簡易実行（デモ用）:

```http
POST /api/v1/agent/run
Content-Type: application/json

{
  "prompt": "青い矩形とテキストを追加",
  "canvas": { ... },
  "tier": "free"
}
```

本番では LLM オーケストレーターが `commands` を生成して `/photo/execute` を呼ぶ構成を推奨します。

## フリーミアム制限

| tier | レイヤー上限 | フィルター |
|------|-------------|-----------|
| free | 5 | 不可 |
| pro | 無制限 | 可 |

`tier: "free"` で `apply_filter` を実行すると 403 が返ります。

## Manus 連携例

Manus のカスタムツールとして以下を登録:

```json
{
  "name": "editional_photo_edit",
  "description": "Meteor Photo で画像を編集する",
  "url": "https://your-site.netlify.app/api/v1/photo/execute",
  "method": "POST",
  "headers": { "Content-Type": "application/json", "X-Meteor-Api-Key": "{{EDITIONAL_AGENT_API_KEY}}" }
}
```

## プロジェクトファイル形式

`.editional.json` — エディターで保存可能。`format: "editional-project"` を含みます。

## 関連リンク

- 開発者ページ: `/developers`
- OpenAPI: `/api/v1/openapi`
- ツール定義: `/api/v1/tools`
