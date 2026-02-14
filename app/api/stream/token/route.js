import { NextResponse } from "next/server";
import { STREAM_CONFIG } from "@/lib/stream-config";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { callId, userId, userName } = await request.json();
    
    if (!callId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Generate token using our config
    const token = STREAM_CONFIG.generateDemoToken(userId, callId);
    
    return NextResponse.json({ 
      token,
      apiKey: STREAM_CONFIG.API_KEY,
      isDemo: !STREAM_CONFIG.isConfigured()
    });
  } catch (e) {
    console.error("Token generation error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}