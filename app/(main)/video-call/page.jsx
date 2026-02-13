import VideoCall from "./video-call-ui";
import { checkUser } from "@/lib/checkUser";

export default async function VideoCallPage({ searchParams }) {
  const { sessionId, token } = await searchParams;
  const user = await checkUser();

  return (
    <VideoCall
      callId={sessionId}
      userToken={token}
      userId={user?.id}
      userName={user?.name}
    />
  );
}
