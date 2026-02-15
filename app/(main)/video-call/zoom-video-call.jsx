"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ZoomVideoCall({ userName, userEmail, userRole, sessionId }) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const redirectToZoom = async () => {
      try {
        if (typeof window === "undefined") {
          return;
        }

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

        if (cancelled) return;

        const meetingNumber = String(data.meetingNumber || "");
        if (!meetingNumber) {
          throw new Error("Missing Zoom meeting number");
        }

        const pwd = data.password || "";
        const baseUrl = "https://zoom.us/wc";
        let joinUrl = `${baseUrl}/${encodeURIComponent(meetingNumber)}/join`;

        const params = new URLSearchParams();
        if (pwd) params.set("pwd", pwd);
        if (userName) params.set("uname", userName);
        if (userEmail) params.set("email", userEmail);

        const query = params.toString();
        if (query) {
          joinUrl += `?${query}`;
        }

        window.location.href = joinUrl;
      } catch (error) {
        console.error("Zoom redirect error", error);
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

    redirectToZoom();

    return () => {
      cancelled = true;
    };
  }, [userName, userEmail, userRole, sessionId]);

  const handleEndCall = () => {
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
      <div className="flex-1 rounded-none md:rounded-lg overflow-hidden border border-emerald-900/20 bg-black flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-white mb-2">Redirecting you to Zoom…</p>
          <p className="text-sm text-muted-foreground">
            If nothing happens, you can safely close this tab and return to your appointments.
          </p>
        </div>
      </div>
    </div>
  );
}
