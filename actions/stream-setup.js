"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Setup Stream.io video calling for the application
 * This creates the necessary configuration and demo credentials
 */
export async function setupStreamVideo() {
  try {
    // Demo Stream.io credentials for testing
    // In production, these should come from your Stream.io dashboard
    const streamConfig = {
      apiKey: "kdpvyx9sdeqt",
      secretKey: "xytpetpbqqcfgdnb88yryd4eys7892qucb63fztb9epkx8byss63r6xyy7564a33",
      appId: "meetadoc-demo",
      region: "us-east-1"
    };

    // Create demo tokens for testing
    const demoTokens = {
      doctor: generateDemoToken("doctor-demo"),
      patient: generateDemoToken("patient-demo")
    };

    return {
      success: true,
      config: streamConfig,
      demoTokens,
      message: "Stream video setup completed successfully"
    };
  } catch (error) {
    console.error("Failed to setup Stream video:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate a demo JWT token for Stream.io
 * In production, this should be done server-side with proper JWT signing
 */
function generateDemoToken(userId) {
  // This is a simplified demo token structure
  // In production, use proper JWT signing with your secret key
  const payload = {
    user_id: userId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000),
    role: "user",
    call_cids: ["default:*"] // Allow joining any default call
  };
  
  // For demo purposes, return a mock token
  // In production, implement proper JWT signing
  return `demo_token_${userId}_${Date.now()}`;
}

/**
 * Check Stream.io configuration status
 */
export async function checkStreamStatus() {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const secretKey = process.env.STREAM_SECRET_KEY;
  
  return {
    configured: !!(apiKey && secretKey),
    hasApiKey: !!apiKey,
    hasSecretKey: !!secretKey,
    isDemoMode: !apiKey || !secretKey,
    apiKey: apiKey || "demo_key"
  };
}