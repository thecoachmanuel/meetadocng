"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  SpeakerLayout,
  CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export default function VideoCall({ callId, userToken, userId, userName, error }) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const router = useRouter();
  const [localToken, setLocalToken] = useState(null);
  const [requesting, setRequesting] = useState(false);

  const tokenToUse = userToken || localToken;

  const client = useMemo(() => {
    if (!apiKey || !userId || !tokenToUse) return null;
    return new StreamVideoClient({
      apiKey,
      user: { id: userId, name: userName || "User" },
      token: tokenToUse,
    });
  }, [apiKey, userId, userName, tokenToUse]);

  // Client token fetch removed - server-side page handles it

  const hasApiKey = Boolean(apiKey && apiKey.trim());

  if (!hasApiKey || error === "not_configured") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Video Service Not Configured</h1>
        <p className="text-muted-foreground mb-6">
          The video provider is not configured. Please contact support to enable video consultations.
        </p>
        <Button onClick={() => router.push("/appointments")} className="bg-emerald-600 hover:bg-emerald-700">
          Back to Appointments
        </Button>
      </div>
    );
  }

  if (!callId || !userId || (!userToken && !localToken)) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Invalid Video Call</h1>
        <p className="text-muted-foreground mb-6">Missing required parameters for the video call.</p>
        <Button onClick={() => router.push("/appointments")} className="bg-emerald-600 hover:bg-emerald-700">
          Back to Appointments
        </Button>
      </div>
    );
  }

  const handleEndCall = async () => {
    try {
      router.push("/appointments");
    } catch (e) {
      toast.error("Failed to end call");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Video Consultation</h1>
      </div>
      {client && (
        <StreamVideo client={client}>
          <Call callType="default" callId={callId}>
            <div className="rounded-lg overflow-hidden border border-emerald-900/20">
              <SpeakerLayout />
              <div className="p-3 flex items-center justify-between bg-muted/30">
                <CallControls />
                <Button onClick={handleEndCall} className="bg-red-600 hover:bg-red-700">End Call</Button>
              </div>
            </div>
          </Call>
        </StreamVideo>
      )}
    </div>
  );
}
