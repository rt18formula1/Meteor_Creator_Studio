import { agentJson, handleOptions, validateAgentApiKey } from "@/lib/agent/auth";
import { AGENT_TOOLS, COMMAND_SCHEMAS, OPENAPI_SPEC } from "@/lib/agent/tools";

export async function GET() {
  return agentJson({
    name: "Meteor Creator Studio Agent API",
    version: "1.0.0",
    description: "外部AIエージェント（Manus等）向け REST API",
    endpoints: {
      openapi: "/api/v1/openapi",
      tools: "/api/v1/tools",
      execute: "/api/v1/photo/execute",
      canvas: "/api/v1/photo/canvas",
      agentRun: "/api/v1/agent/run",
    },
    docs: "/developers",
    agentsGuide: "/AGENTS.md",
  });
}

export async function OPTIONS() {
  return handleOptions();
}
