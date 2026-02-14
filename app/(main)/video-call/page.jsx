import VideoCall from "./video-call-ui";
import { checkUser } from "@/lib/checkUser";

export default async function VideoCallPage({ searchParams }) {
  const sessionId = searchParams?.sessionId || searchParams?.appointmentId;
  const token = searchParams?.token;
  const error = searchParams?.error;
  const user = await checkUser();

  return (
    <VideoCall
      callId={sessionId}
      userToken={token}
      userId={user?.id}
      userName={user?.name}
      error={error}
    />
  );
}
