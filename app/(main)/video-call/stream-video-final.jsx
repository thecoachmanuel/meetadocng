"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import Stream.io React SDK
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  useCall,
  useCallStateHooks,
  ParticipantView,
  CallingState
} from '@stream-io/video-react-sdk';

// Stream.io configuration
const API_KEY = "kdpvyx9sdeqt";

// Custom hook for Stream.io video calling
function VideoCallUI({ userId, userName, callId }) {
  const call = useCall();
  const { useCallCallingState, useLocalParticipant, useRemoteParticipants } = useCallStateHooks();
  
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      setIsConnecting(false);
      toast.success("Connected to video consultation!");
    } else if (callingState === CallingState.JOINING) {
      setIsConnecting(true);
    } else if (callingState === CallingState.LEFT) {
      toast.info("Left the video consultation");
    }
  }, [callingState]);

  const toggleVideo = async () => {
    if (call) {
      try {
        await call.camera.toggle();
        setIsVideoMuted(!isVideoMuted);
        toast.info(isVideoMuted ? "Camera enabled" : "Camera disabled");
      } catch (error) {
        console.error("Failed to toggle video:", error);
        toast.error("Failed to toggle camera");
      }
    }
  };

  const toggleAudio = async () => {
    if (call) {
      try {
        await call.microphone.toggle();
        setIsAudioMuted(!isAudioMuted);
        toast.info(isAudioMuted ? "Microphone enabled" : "Microphone disabled");
      } catch (error) {
        console.error("Failed to toggle audio:", error);
        toast.error("Failed to toggle microphone");
      }
    }
  };

  const leaveCall = async () => {
    if (call) {
      try {
        await call.leave();
      } catch (error) {
        console.error("Failed to leave call:", error);
      }
    }
  };

  if (isConnecting) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Connecting to Video Consultation</h1>
        <p className="text-muted-foreground mb-6">Setting up your secure video call...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
        <div className="mt-4 bg-gray-800 rounded-lg p-3 max-w-md mx-auto">
          <p className="text-xs text-gray-400">Call ID: {callId}</p>
          <p className="text-xs text-gray-400">User: {userName} ({userId})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Video Consultation</h1>
        <p className="text-muted-foreground">Powered by Stream.io Professional Video</p>
        <p className="text-sm text-emerald-400 mt-2">Connected as {userName}</p>
        <div className="mt-2">
          <span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs">
            {remoteParticipants.length + 1} Participants
          </span>
        </div>
      </div>
      
      <div className="flex-1 rounded-lg overflow-hidden border border-emerald-900/20 bg-gray-900">
        <div className="h-full flex flex-col lg:flex-row">
          {/* Remote Participants (Main View) */}
          <div className="flex-1 relative bg-gray-800">
            {remoteParticipants.length > 0 ? (
              <div className="h-full grid gap-2 p-2">
                {remoteParticipants.map((participant) => (
                  <div key={participant.userId} className="relative h-full">
                    <ParticipantView
                      participant={participant}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 rounded px-2 py-1">
                      <p className="text-white text-xs">{participant.name || 'Participant'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-white font-medium">Waiting for participant...</p>
                  <p className="text-gray-400 text-sm mt-2">Remote video will appear here</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Local Participant (Picture-in-Picture) */}
          <div className="lg:w-80 lg:border-l border-emerald-900/20 p-4 bg-gray-900">
            <div className="relative">
              {localParticipant && (
                <>
                  <ParticipantView
                    participant={localParticipant}
                    className="w-full h-48 object-cover rounded-lg border border-gray-700"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 rounded px-2 py-1">
                    <p className="text-white text-xs">You</p>
                  </div>
                </>
              )}
              
              {/* Video Controls */}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded-full ${isVideoMuted ? 'bg-red-600' : 'bg-gray-800'} text-white hover:opacity-80 transition-opacity`}
                  title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoMuted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-full ${isAudioMuted ? 'bg-red-600' : 'bg-gray-800'} text-white hover:opacity-80 transition-opacity`}
                  title={isAudioMuted ? 'Turn on microphone' : 'Turn off microphone'}
                >
                  {isAudioMuted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V6a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V6a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call Controls */}
      <div className="p-4 flex items-center justify-center bg-muted/30 border-t border-emerald-900/20">
        <button 
          onClick={leaveCall} 
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          End Call
        </button>
      </div>
    </div>
  );
}

// Main component that wraps everything with Stream.io providers
export default function StreamVideoFinal({ callId, userId, userName }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeStream = async () => {
      try {
        setIsInitializing(true);
        
        // Create user object
        const user = {
          id: userId,
          name: userName,
          image: `https://getstream.io/random_svg/?id=${userId}&name=${encodeURIComponent(userName)}`,
        };

        // Generate token (in production, this should come from your backend)
        const token = `stream_token_${userId}_${callId}_${Date.now()}`;

        // Create StreamVideoClient
        const streamClient = new StreamVideoClient({
          apiKey: API_KEY,
          user,
          token,
        });

        // Create and join call
        const streamCall = streamClient.call('default', callId);
        await streamCall.join({ create: true });

        setClient(streamClient);
        setCall(streamCall);
        setIsInitializing(false);
        
        toast.success("Connected to Stream.io video service!");
        
      } catch (error) {
        console.error("Failed to initialize Stream.io:", error);
        toast.error("Failed to connect to video service");
        setIsInitializing(false);
      }
    };

    initializeStream();

    // Cleanup
    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [callId, userId, userName]);

  const handleLeaveCall = () => {
    if (call) {
      call.leave().then(() => {
        router.push("/appointments");
      }).catch(() => {
        router.push("/appointments");
      });
    } else {
      router.push("/appointments");
    }
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Initializing Stream.io</h1>
        <p className="text-muted-foreground mb-6">Setting up professional video calling...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Connection Failed</h1>
        <p className="text-muted-foreground mb-6">Unable to connect to Stream.io video service.</p>
        <div className="space-y-4">
          <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
            Try Again
          </Button>
          <Button onClick={handleLeaveCall} variant="outline">
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoCallUI 
          callId={callId} 
          userId={userId} 
          userName={userName} 
        />
      </StreamCall>
    </StreamVideo>
  );
}
