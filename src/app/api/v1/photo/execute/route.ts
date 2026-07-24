import { agentJson, handleOptions, validateAgentApiKey } from "@/lib/agent/auth";
import {
  type EditorCommand,
  executeCommands,
} from "@/lib/editor/command-engine";
import { type CanvasDocument, extractLayers } from "@/lib/editor/document";
import { getPlanLimitMeta, PLAN_LIMITS } from "@/lib/freemium";
import type { PlanTier } from "@/lib/types";

type ExecuteBody = {
  canvas: CanvasDocument;
  commands: EditorCommand[];
  tier?: PlanTier;
};

export async function POST(request: Request) {
  const authError = validateAgentApiKey(request);
  if (authError) return authError;

  let body: ExecuteBody;
  try {
    body = await request.json();
  } catch {
    return agentJson({ error: "invalid_json", message: "Request body must be JSON" }, 400);
  }

  if (!body.canvas || !Array.isArray(body.commands)) {
    return agentJson(
      { error: "invalid_request", message: "canvas and commands are required" },
      400,
    );
  }

  const tier: PlanTier = body.tier === "pro" ? "pro" : "free";
  const limits = PLAN_LIMITS[tier];

  const filterCommands = body.commands.filter((c) => c.type === "apply_filter");
  if (filterCommands.length > 0 && !limits.advancedFilters) {
    return agentJson(
      {
        error: "plan_limit",
        message: "Advanced filters require Pro plan",
        blockedCommands: filterCommands.map((c) => c.type),
        plan: getPlanLimitMeta(tier),
      },
      403,
    );
  }

  const { canvas, results, layers } = executeCommands(body.canvas, body.commands, {
    maxLayers: limits.maxLayers,
  });

  return agentJson({
    success: true,
    canvas,
    results,
    layers,
    tier,
    plan: getPlanLimitMeta(tier),
    meta: {
      layerCount: layers.length,
      maxLayers: getPlanLimitMeta(tier).maxLayers,
    },
  });
}

export async function OPTIONS() {
  return handleOptions();
}
