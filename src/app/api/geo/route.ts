import { NextResponse } from "next/server";

// Vercel adds this header automatically at the edge for every request
// that reaches a serverless function — no geo-IP service, no extra
// dependency, no API key. Falls back to null locally (Codespaces dev)
// where this header isn't present.
export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  return NextResponse.json({ country });
}