import type { EditorCommand } from "@/lib/editor/command-engine";

export type AgentTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "photo_execute_commands",
    description:
      "Meteor Photo のキャンバスに対してコマンドを実行する。外部AI（Manus等）はこのツールで画像編集を自動化できる。",
    inputSchema: {
      type: "object",
      required: ["canvas", "commands"],
      properties: {
        canvas: {
          type: "object",
          description: "Fabric.js 形式のキャンバス JSON（toObject 出力）",
        },
        commands: {
          type: "array",
          description: "実行するコマンドの配列",
          items: { type: "object" },
        },
        tier: {
          type: "string",
          enum: ["free", "pro"],
          default: "free",
        },
      },
    },
  },
  {
    name: "photo_get_empty_canvas",
    description: "新規ドキュメント用の空キャンバス JSON を取得する",
    inputSchema: {
      type: "object",
      properties: {
        width: { type: "number", default: 1920 },
        height: { type: "number", default: 1080 },
        tier: {
          type: "string",
          enum: ["free", "pro"],
          default: "free",
          description: "free は最大 1920x1080、pro は最大 16384px",
        },
      },
    },
  },
  {
    name: "photo_list_layers",
    description: "キャンバス内のレイヤー一覧を取得する",
    inputSchema: {
      type: "object",
      required: ["canvas"],
      properties: {
        canvas: { type: "object" },
      },
    },
  },
];

export const COMMAND_SCHEMAS: Record<EditorCommand["type"], AgentTool> = {
  add_text: {
    name: "add_text",
    description: "テキストレイヤーを追加",
    inputSchema: {
      type: "object",
      required: ["type", "text", "x", "y"],
      properties: {
        type: { const: "add_text" },
        text: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        fontSize: { type: "number", default: 32 },
        color: { type: "string", default: "#000000" },
        layerName: { type: "string" },
      },
    },
  },
  add_rectangle: {
    name: "add_rectangle",
    description: "矩形レイヤーを追加",
    inputSchema: {
      type: "object",
      required: ["type", "x", "y", "width", "height"],
      properties: {
        type: { const: "add_rectangle" },
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        fill: { type: "string" },
        stroke: { type: "string" },
        layerName: { type: "string" },
      },
    },
  },
  add_ellipse: {
    name: "add_ellipse",
    description: "楕円レイヤーを追加",
    inputSchema: {
      type: "object",
      required: ["type", "x", "y", "radius"],
      properties: {
        type: { const: "add_ellipse" },
        x: { type: "number" },
        y: { type: "number" },
        radius: { type: "number" },
        fill: { type: "string" },
        layerName: { type: "string" },
      },
    },
  },
  remove_layer: {
    name: "remove_layer",
    description: "レイヤーを削除（背景は不可）",
    inputSchema: {
      type: "object",
      required: ["type", "layerId"],
      properties: {
        type: { const: "remove_layer" },
        layerId: { type: "string" },
      },
    },
  },
  set_layer_visibility: {
    name: "set_layer_visibility",
    description: "レイヤーの表示/非表示を切り替え",
    inputSchema: {
      type: "object",
      required: ["type", "layerId", "visible"],
      properties: {
        type: { const: "set_layer_visibility" },
        layerId: { type: "string" },
        visible: { type: "boolean" },
      },
    },
  },
  set_layer_opacity: {
    name: "set_layer_opacity",
    description: "レイヤーの不透明度を設定（0-1）",
    inputSchema: {
      type: "object",
      required: ["type", "layerId", "opacity"],
      properties: {
        type: { const: "set_layer_opacity" },
        layerId: { type: "string" },
        opacity: { type: "number", minimum: 0, maximum: 1 },
      },
    },
  },
  rename_layer: {
    name: "rename_layer",
    description: "レイヤー名を変更",
    inputSchema: {
      type: "object",
      required: ["type", "layerId", "name"],
      properties: {
        type: { const: "rename_layer" },
        layerId: { type: "string" },
        name: { type: "string" },
      },
    },
  },
  set_background: {
    name: "set_background",
    description: "背景色を変更",
    inputSchema: {
      type: "object",
      required: ["type", "color"],
      properties: {
        type: { const: "set_background" },
        color: { type: "string" },
      },
    },
  },
  clear_layers: {
    name: "clear_layers",
    description: "背景以外のレイヤーをすべて削除",
    inputSchema: {
      type: "object",
      required: ["type"],
      properties: { type: { const: "clear_layers" } },
    },
  },
  apply_filter: {
    name: "apply_filter",
    description: "レイヤーにフィルターを適用（Pro推奨）",
    inputSchema: {
      type: "object",
      required: ["type", "layerId", "filter"],
      properties: {
        type: { const: "apply_filter" },
        layerId: { type: "string" },
        filter: {
          type: "string",
          enum: ["brightness", "contrast", "blur", "grayscale", "saturate"],
        },
        value: { type: "number" },
      },
    },
  },
  list_layers: {
    name: "list_layers",
    description: "レイヤー一覧を返す（副作用なし）",
    inputSchema: {
      type: "object",
      required: ["type"],
      properties: { type: { const: "list_layers" } },
    },
  },
};

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Meteor Creator Studio Agent API",
    version: "1.0.0",
    description:
      "Manus 等の外部AIエージェントが Meteor Photo を操作するための REST API。ステートレス設計のため、キャンバス JSON をリクエストごとに送受信します。",
  },
  servers: [{ url: "/api/v1", description: "Meteor API v1" }],
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/photo/execute": {
      post: {
        summary: "キャンバスにコマンドを実行",
        operationId: "photoExecute",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["canvas", "commands"],
                properties: {
                  canvas: { type: "object" },
                  commands: { type: "array", items: { type: "object" } },
                  tier: { type: "string", enum: ["free", "pro"], default: "free" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "更新後のキャンバスと実行結果",
          },
        },
      },
    },
    "/photo/canvas": {
      get: {
        summary: "空のキャンバス JSON を取得",
        operationId: "photoGetEmptyCanvas",
        parameters: [
          { name: "width", in: "query", schema: { type: "integer", default: 1920 } },
          { name: "height", in: "query", schema: { type: "integer", default: 1080 } },
          {
            name: "tier",
            in: "query",
            schema: { type: "string", enum: ["free", "pro"], default: "free" },
          },
        ],
        responses: { "200": { description: "空キャンバス" } },
      },
    },
    "/tools": {
      get: {
        summary: "MCP互換ツール定義一覧",
        operationId: "listTools",
        responses: { "200": { description: "ツール一覧" } },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-Meteor-Api-Key",
        description: "環境変数 EDITIONAL_AGENT_API_KEY と一致するキー（未設定時は認証スキップ）",
      },
    },
  },
};
