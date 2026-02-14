import VideoCall from "./video-call-ui";
import { checkUser } from "@/lib/checkUser";
import { generateVideoToken } from "@/actions/appointments";

export default async function VideoCallPage({ searchParams }) {
  const sessionId = searchParams?.sessionId || searchParams?.appointmentId;
  const token = searchParams?.token;
  const error = searchParams?.error;
  const user = await checkUser();

  let serverToken = token;
  let serverError = error;

  if (!serverToken && !serverError && sessionId && user?.id) {
    const fd = new FormData();
    fd.append("appointmentId", searchParams?.appointmentId || sessionId);
    const res = await generateVideoToken(fd);
    if (res?.success && res?.token) {
      serverToken = res.token;
    } else if (res?.error) {
      serverError = res.error;
    }
  }

  return (
    <VideoCall
      callId={sessionId}
      userToken={serverToken}
      userId={user?.id}
      userName={user?.name}
      error={serverError}
    />
  );
}
