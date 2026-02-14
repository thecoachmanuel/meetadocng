// Stream.io configuration for video calling
export const STREAM_CONFIG = {
  // Demo credentials for testing - these are working test keys
  API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY || "kdpvyx9sdeqt",
  SECRET_KEY: process.env.STREAM_SECRET_KEY || "xytpetpbqqcfgdnb88yryd4eys7892qucb63fztb9epkx8byss63r6xyy7564a33",
  
  // Check if Stream is properly configured
  isConfigured: () => {
    return !!(process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim() && process.env.STREAM_SECRET_KEY?.trim());
  },
  
  // Generate a demo token for testing
  generateDemoToken: (userId, callId) => {
    // For demo purposes, create a mock token
    // In production, this should be a proper JWT signed with your secret
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      user_id: userId,
      call_cids: [`default:${callId}`],
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
      role: "user",
      iss: "@stream-io/demo"
    }));
    
    return `${header}.${payload}.demo_signature`;
  },
  
  // Get the API key
  getApiKey: () => {
    return process.env.NEXT_PUBLIC_STREAM_API_KEY || "kdpvyx9sdeqt";
  }
};