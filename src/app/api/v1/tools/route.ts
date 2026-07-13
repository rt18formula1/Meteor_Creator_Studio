import { agentJson, handleOptions } from "@/lib/agent/auth";
import { AGENT_TOOLS, COMMAND_SCHEMAS } from "@/lib/agent/tools";

export async function GET() {
  return agentJson({
    format: "mcp-tools",
    version: "1.0.0",
    tools: AGENT_TOOLS,
    commands: Object.values(COMMAND_SCHEMAS),
    usage: {
      execute: "POST /api/v1/photo/execute",
      example: {
        canvas: "{ ... fabric canvas json ... }",
        commands: [
          { type: "add_text", text: "Hello", x: 100, y: 100 },
          { type: "add_rectangle", x: 200, y: 200, width: 300, height: 150, fill: "#1473e6" },
        ],
      },
    },
  });
}

export async function OPTIONS() {
  return handleOptions();
}
