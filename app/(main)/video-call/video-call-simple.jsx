"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VideoCallSimple({ callId, userToken, userId, userName, error }) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (error || !callId || !userToken || !userId) {
      setIsLoading(false);
      return;
    }

    // Simulate video connection
    const connectVideo = async () => {
      try {
        setIsLoading(true);
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsConnected(true);
        setIsLoading(false);
        toast.success("Connected to video call");
      } catch (err) {
        console.error("Failed to connect video call:", err);
        toast.error("Failed to join video call");
        setIsLoading(false);
      }
    };

    connectVideo();
  }, [callId, userToken, userId, error]);

  const handleEndCall = () => {
    setIsConnected(false);
    router.push("/appointments");
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Video Call Error</h1>
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
        <p className="text-muted-foreground mb-6">Connecting to your consultation...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Connection Failed</h1>
        <p className="text-muted-foreground mb-6">Unable to establish video connection.</p>
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
      
      <div className="flex-1 rounded-lg overflow-hidden border border-emerald-900/20 bg-gray-900">
        <div className="h-full flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Video Call Active</h3>
            <p className="text-muted-foreground mb-4">Connected as {userName}</p>
            <p className="text-sm text-emerald-400">Session ID: {callId}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex items-center justify-center bg-muted/30 border-t border-emerald-900/20">
        <Button 
          onClick={handleEndCall} 
          className="bg-red-600 hover:bg-red-700"
          size="lg"
        >
          End Call
        </Button>
      </div>
    </div>
  );
}