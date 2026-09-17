import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET() {
  return NextResponse.json(store.list());
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const issue = store.create(body);
  return NextResponse.json(issue, { status: 201 });
}
