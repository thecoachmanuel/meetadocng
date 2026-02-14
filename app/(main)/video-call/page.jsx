import VideoCall from "./video-call-ui";
import { checkUser } from "@/lib/checkUser";
import { generateVideoToken } from "@/actions/appointments";

export default async function VideoCallPage({ searchParams }) {
  const params = await searchParams;
  const sessionId = params?.sessionId || params?.appointmentId;
  const token = params?.token;
  const error = params?.error;
  const user = await checkUser();

  let serverToken = token;
  let serverError = error;

  // If no token and no error, generate token server-side
  if (!serverToken && !serverError && sessionId && user?.id) {
    const fd = new FormData();
    fd.append("appointmentId", params?.appointmentId || sessionId);
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