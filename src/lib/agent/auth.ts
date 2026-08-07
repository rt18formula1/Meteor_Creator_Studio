import { NextResponse } from "next/server";

export function validateAgentApiKey(request: Request): NextResponse | null {
  const expected = process.env.EDITIONAL_AGENT_API_KEY;
  if (!expected) return null;

  const provided =
    request.headers.get("x-editional-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!provided || provided !== expected) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message:
          "Invalid or missing API key. Set X-Meteor-Api-Key header or Authorization: Bearer <key>.",
      },
      { status: 401 },
    );
  }

  return null;
}

export function agentJson<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "X-Meteor-Api-Version": "1.0.0",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Meteor-Api-Key, Authorization",
    },
  });
}

export function handleOptions() {
  return agentJson({ ok: true });
}
