import { agentJson } from "@/lib/agent/auth";
import { OPENAPI_SPEC } from "@/lib/agent/tools";

export async function GET() {
  return agentJson(OPENAPI_SPEC);
}
