import CameraDebug from "./camera-debug";
import { checkUser } from "@/lib/checkUser";

export default async function VideoCallPage({ searchParams }) {
  const params = await searchParams;
  const sessionId = params?.sessionId || params?.appointmentId;
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

  return (
    <CameraDebug
      callId={sessionId}
      userId={user.id}
      userName={user.name || user.email?.split("@")[0] || "User"}
      error={error}
    />
  );
}