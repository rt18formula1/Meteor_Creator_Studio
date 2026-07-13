import { agentJson, handleOptions, validateAgentApiKey } from "@/lib/agent/auth";
import { createEmptyCanvas } from "@/lib/editor/document";

export async function GET(request: Request) {
  const authError = validateAgentApiKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const width = Number(searchParams.get("width") ?? 1920);
  const height = Number(searchParams.get("height") ?? 1080);

  return agentJson({
    canvas: createEmptyCanvas(width, height),
    width,
    height,
  });
}

export async function OPTIONS() {
  return handleOptions();
}
