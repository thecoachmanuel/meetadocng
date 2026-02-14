"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  SpeakerLayout,
  CallControls,
  StreamTheme,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export default function VideoCallClient({ callId, userToken, userId, userName, error }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (error || !callId || !userToken || !userId) {
      setIsLoading(false);
      return;
    }

    const initializeVideo = async () => {
      try {
        setIsLoading(true);
        
        // Create Stream client
        const streamClient = new StreamVideoClient({
          apiKey: "kdpvyx9sdeqt", // Your Stream API key
          user: { 
            id: userId, 
            name: userName || "User",
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "User")}&background=10b981&color=fff`
          },
          token: userToken,
        });

        // Create and join call
        const streamCall = streamClient.call("default", callId);
        await streamCall.join({ create: true });

        setClient(streamClient);
        setCall(streamCall);
        setIsLoading(false);
        
        toast.success("Connected to video call");
      } catch (err) {
        console.error("Failed to initialize video call:", err);
        toast.error("Failed to join video call. Please try again.");
        setIsLoading(false);
      }
    };

    initializeVideo();

    // Cleanup on unmount
    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [callId, userToken, userId, userName, error]);

  const handleEndCall = () => {
    if (call) {
      call.leave().catch(console.error);
    }
    if (client) {
      client.disconnectUser();
    }
    router.push("/appointments");
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Video Service Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={handleEndCall} className="bg-emerald-600 hover:bg-emerald-700">
          Back to Appointments
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Joining Video Call</h1>
        <p className="text-muted-foreground mb-6">Setting up your video consultation...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Video Call Error</h1>
        <p className="text-muted-foreground mb-6">Unable to connect to video service.</p>
        <Button onClick={handleEndCall} className="bg-emerald-600 hover:bg-emerald-700">
          Back to Appointments
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Video Consultation</h1>
        <p className="text-muted-foreground">Your secure video call is ready</p>
      </div>
      
      <div className="flex-1 rounded-lg overflow-hidden border border-emerald-900/20">
        <StreamVideo client={client}>
          <StreamTheme>
            <Call call={call}>
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <SpeakerLayout />
                </div>
                <div className="p-4 flex items-center justify-between bg-muted/30 border-t border-emerald-900/20">
                  <CallControls />
                  <Button 
                    onClick={handleEndCall} 
                    className="bg-red-600 hover:bg-red-700 ml-4"
                    size="sm"
                  >
                    End Call
                  </Button>
                </div>
              </div>
            </Call>
          </StreamTheme>
        </StreamVideo>
      </div>
    </div>
  );
}