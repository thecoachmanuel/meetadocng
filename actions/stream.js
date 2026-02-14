"use server";

import { STREAM_CONFIG } from "@/lib/stream-config";
import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Generate a Stream.io token for video calling
 * This creates a proper JWT token for authenticated users
 */
export async function generateStreamToken(userId, callId) {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data?.user) {
      throw new Error("Unauthorized");
    }

    // Get user details from database
    const user = await db.user.findUnique({
      where: { supabaseUserId: data.user.id },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Generate token using our config
    const token = STREAM_CONFIG.generateDemoToken(user.id, callId);
    
    return {
      success: true,
      token: token,
      apiKey: STREAM_CONFIG.API_KEY,
      userId: user.id,
      userName: user.name || user.email?.split("@")[0] || "User",
      isDemo: !STREAM_CONFIG.isConfigured()
    };
  } catch (error) {
    console.error("Failed to generate Stream token:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if Stream is properly configured
 */
export async function checkStreamConfiguration() {
  return {
    configured: STREAM_CONFIG.isConfigured(),
    apiKey: STREAM_CONFIG.API_KEY,
    hasSecretKey: !!STREAM_CONFIG.SECRET_KEY,
    isDemoMode: !STREAM_CONFIG.isConfigured()
  };
}