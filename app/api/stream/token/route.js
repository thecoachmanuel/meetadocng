import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET_KEY;
    if (!apiKey || !secret) {
      return NextResponse.json({ error: "Stream server not configured" }, { status: 501 });
    }

    const { callId, userId, userName } = await request.json();

    const { StreamClient } = await import("@stream-io/node-sdk");
    const client = new StreamClient({ apiKey, secret });

    const token = client.createToken(userId);

    // Optionally ensure call exists
    try {
      await client.video.call("default", callId).getOrCreate({ created_by_id: userId });
    } catch {}

    return NextResponse.json({ token });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

