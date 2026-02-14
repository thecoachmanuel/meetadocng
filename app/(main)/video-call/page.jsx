import VideoCallClient from "./video-call-client";
import { checkUser } from "@/lib/checkUser";
import { generateStreamToken } from "@/actions/stream";

export default async function VideoCallPage({ searchParams }) {
  const params = await searchParams;
  const sessionId = params?.sessionId || params?.appointmentId;
  const token = params?.token;
  const error = params?.error;
  
  const user = await checkUser();
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Authentication Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to join video calls.</p>
        <a href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md">
          Sign In
        </a>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Invalid Video Call</h1>
        <p className="text-muted-foreground mb-6">Missing session ID for the video call.</p>
        <a href="/appointments" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md">
          Back to Appointments
        </a>
      </div>
    );
  }

  // Generate token if not provided
  let finalToken = token;
  let finalUserName = user.name || user.email?.split("@")[0] || "User";
  
  if (!finalToken) {
    const tokenResult = await generateStreamToken(user.id, sessionId);
    if (tokenResult.success) {
      finalToken = tokenResult.token;
      finalUserName = tokenResult.userName;
    } else {
      return (
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Video Call Error</h1>
          <p className="text-muted-foreground mb-6">Failed to generate video token. Please try again.</p>
          <a href="/appointments" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md">
            Back to Appointments
          </a>
        </div>
      );
    }
  }

  return (
    <VideoCallClient
      callId={sessionId}
      userToken={finalToken}
      userId={user.id}
      userName={finalUserName}
      error={error}
    />
  );
}