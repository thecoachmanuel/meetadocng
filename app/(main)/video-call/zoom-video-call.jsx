"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ZoomVideoCall({ userName, userEmail, userRole, sessionId }) {
  const router = useRouter();
  const zoomRootRef = useRef(null);
  const clientRef = useRef(null);
  const [isJoining, setIsJoining] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const initAndJoin = async () => {
      try {
        if (typeof window === "undefined") {
          return;
        }

        const { default: ZoomMtgEmbedded } = await import("@zoom/meetingsdk/embedded");

        const rootElement = zoomRootRef.current;
        if (!rootElement) {
          return;
        }

        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        await client.init({
          zoomAppRoot: rootElement,
          language: "en-US",
          patchJsMedia: true,
          leaveOnPageUnload: true,
        });

        const response = await fetch("/api/zoom/signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: userRole === "DOCTOR" ? 1 : 0,
            sessionId,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Unable to get Zoom configuration");
        }

        const data = await response.json();

        await client.join({
          sdkKey: data.sdkKey,
          signature: data.signature,
          meetingNumber: data.meetingNumber,
          password: data.password,
          userName,
          userEmail,
        });

        if (!cancelled) {
          setIsJoining(false);
        }
      } catch (error) {
        console.error("Zoom meeting error", error);
        if (!cancelled) {
          setHasError(true);
          setErrorMessage(
            error?.message ||
              "Unable to start the Zoom meeting. Please check your configuration and try again."
          );
          setIsJoining(false);
          toast.error("Failed to start Zoom meeting");
        }
      }
    };

    initAndJoin();

    return () => {
      cancelled = true;
      if (clientRef.current) {
        clientRef.current
          .leave()
          .catch(() => undefined);
      }
    };
  }, [userName, userEmail, userRole, sessionId]);

  const handleEndCall = () => {
    if (clientRef.current) {
      clientRef.current.leave().catch(() => undefined);
    }
    router.push("/appointments");
  };

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-xl">
        <h1 className="text-3xl font-bold text-white mb-4">Unable To Start Meeting</h1>
        <p className="text-muted-foreground mb-6">
          {errorMessage}
        </p>
        <div className="space-y-4">
          <Button onClick={() => window.location.reload()} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Try Again
          </Button>
          <Button onClick={handleEndCall} variant="outline" className="w-full">
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Starting Zoom Consultation</h1>
        <p className="text-muted-foreground mb-6">Preparing your secure Zoom meeting room...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-4 py-4 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4 px-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Zoom Consultation</h1>
          <p className="text-sm text-muted-foreground">
            Connected as {userName}
          </p>
        </div>
        <Button onClick={handleEndCall} className="bg-red-600 hover:bg-red-700" size="sm">
          End Call
        </Button>
      </div>
      <div className="flex-1 rounded-none md:rounded-lg overflow-hidden border border-emerald-900/20 bg-black">
        <div ref={zoomRootRef} className="w-full h-full" />
      </div>
    </div>
  );
}
