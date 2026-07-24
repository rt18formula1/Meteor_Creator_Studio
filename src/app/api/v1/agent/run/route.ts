import { agentJson, handleOptions, validateAgentApiKey } from "@/lib/agent/auth";
import { type EditorCommand, executeCommands } from "@/lib/editor/command-engine";
import { createEmptyCanvas, extractLayers } from "@/lib/editor/document";
import { getPlanLimitMeta, PLAN_LIMITS } from "@/lib/freemium";
import type { PlanTier } from "@/lib/types";

type RunBody = {
  prompt?: string;
  tier?: PlanTier;
  canvas?: ReturnType<typeof createEmptyCanvas>;
  commands?: EditorCommand[];
};

/**
 * 高レベルエージェント実行エンドポイント。
 * Manus 等は prompt + commands を送るか、commands のみ送る。
 * prompt は将来 LLM オーケストレーション用（現状は commands をそのまま実行）。
 */
export async function POST(request: Request) {
  const authError = validateAgentApiKey(request);
  if (authError) return authError;

  let body: RunBody;
  try {
    body = await request.json();
  } catch {
    return agentJson({ error: "invalid_json" }, 400);
  }

  const tier: PlanTier = body.tier === "pro" ? "pro" : "free";
  const canvas = body.canvas ?? createEmptyCanvas();
  const commands = body.commands ?? [];
  const limits = PLAN_LIMITS[tier];

  if (commands.length === 0 && body.prompt) {
    // 簡易プロンプト解析（デモ用 — 本番は LLM 連携）
    const prompt = body.prompt.toLowerCase();
    if (prompt.includes("テキスト") || prompt.includes("text")) {
      commands.push({
        type: "add_text",
        text: body.prompt.slice(0, 40),
        x: 200,
        y: 200,
        fontSize: 48,
        color: "#1473e6",
        layerName: "AIテキスト",
      });
    }
    if (prompt.includes("青") || prompt.includes("blue")) {
      commands.push({
        type: "add_rectangle",
        x: 300,
        y: 300,
        width: 400,
        height: 200,
        fill: "#1473e6",
        layerName: "AI矩形",
      });
    }
    if (commands.length === 0) {
      commands.push({ type: "list_layers" });
    }
  }

  const { canvas: nextCanvas, results, layers } = executeCommands(canvas, commands, {
    maxLayers: limits.maxLayers,
  });

  return agentJson({
    sessionId: `run-${Date.now()}`,
    status: "completed",
    prompt: body.prompt ?? null,
    canvas: nextCanvas,
    results,
    layers,
    layersSummary: extractLayers(nextCanvas),
    tier,
    plan: getPlanLimitMeta(tier),
    nextSteps: [
      "Apply returned canvas JSON to editor via loadFromJSON",
      "Or chain another POST /api/v1/agent/run with updated canvas",
    ],
  });
}

export async function OPTIONS() {
  return handleOptions();
}
