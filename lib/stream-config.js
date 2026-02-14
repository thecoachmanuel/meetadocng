// Stream.io configuration for video calling
import jwt from "jsonwebtoken";

export const STREAM_CONFIG = {
  // Demo credentials for testing - these are working test keys
  API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY || "kdpvyx9sdeqt",
  SECRET_KEY: process.env.STREAM_SECRET_KEY || "xytpetpbqqcfgdnb88yryd4eys7892qucb63fztb9epkx8byss63r6xyy7564a33",
  
  // Check if Stream is properly configured
  isConfigured: () => {
    return !!(process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim() && process.env.STREAM_SECRET_KEY?.trim());
  },
  
  // Generate a proper JWT token for Stream.io
  generateToken: (userId, callId, expiration = 24 * 60 * 60) => {
    const payload = {
      user_id: userId,
      call_cids: [`default:${callId}`],
      exp: Math.floor(Date.now() / 1000) + expiration,
      iat: Math.floor(Date.now() / 1000),
      role: "user",
      iss: "@stream-io/dashboard"
    };
    
    return jwt.sign(payload, STREAM_CONFIG.SECRET_KEY);
  },
  
  // Generate a demo token for testing
  generateDemoToken: (userId, callId) => {
    // For demo purposes, create a proper JWT with the secret key
    return STREAM_CONFIG.generateToken(userId, callId);
  },
  
  // Get the API key
  getApiKey: () => {
    return process.env.NEXT_PUBLIC_STREAM_API_KEY || "kdpvyx9sdeqt";
  }
};