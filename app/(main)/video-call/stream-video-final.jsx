"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { recordAppointmentCallDuration } from "@/actions/appointments";

import {
	StreamVideo,
	StreamVideoClient,
	StreamCall,
	useCall,
	useCallStateHooks,
	ParticipantView,
	CallingState
} from "@stream-io/video-react-sdk";

function VideoCallUI({ userId, userName, callId, appointmentId, onLeave }) {
	const call = useCall();
	const { useCallCallingState, useLocalParticipant, useRemoteParticipants } = useCallStateHooks();

	const callingState = useCallCallingState();
	const localParticipant = useLocalParticipant();
	const remoteParticipants = useRemoteParticipants();
	const primaryRemote = remoteParticipants[0];

	const [isVideoMuted, setIsVideoMuted] = useState(false);
	const [isAudioMuted, setIsAudioMuted] = useState(false);
	const [isConnecting, setIsConnecting] = useState(true);
	const [hasLeft, setHasLeft] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [isLandscape, setIsLandscape] = useState(false);
  const callStartRef = useRef(null);
  const hasRecordedRef = useRef(false);

  const { fn: submitCallDuration } = useFetch(recordAppointmentCallDuration);

  useEffect(() => {
    if (callingState === CallingState.JOINED && !callStartRef.current) {
      callStartRef.current = Date.now();
    }
  }, [callingState]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const updateOrientation = () => {
			setIsLandscape(window.innerWidth > window.innerHeight);
		};
		updateOrientation();
		window.addEventListener("resize", updateOrientation);
		window.addEventListener("orientationchange", updateOrientation);
		return () => {
			window.removeEventListener("resize", updateOrientation);
			window.removeEventListener("orientationchange", updateOrientation);
		};
	}, []);

  useEffect(() => {
    let interval;
    if (callingState === CallingState.JOINED && !hasLeft) {
      interval = setInterval(() => {
        if (callStartRef.current) {
          const ms = Date.now() - callStartRef.current;
          setElapsedSeconds(Math.floor(ms / 1000));
        }
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callingState, hasLeft]);

  const recordDuration = useCallback(async () => {
    if (!appointmentId || hasRecordedRef.current || !callStartRef.current) return;
    hasRecordedRef.current = true;
    const ms = Date.now() - callStartRef.current;
    const minutes = Math.max(1, Math.round(ms / 60000));
    const fd = new FormData();
    fd.append("appointmentId", appointmentId);
    fd.append("durationMinutes", String(minutes));
    try {
      await submitCallDuration(fd);
    } catch {}
  }, [appointmentId, submitCallDuration]);

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      setIsConnecting(false);
      toast.success("Connected to video consultation!");
    } else if (callingState === CallingState.JOINING) {
      setIsConnecting(true);
    } else if (callingState === CallingState.LEFT && !hasLeft) {
      setHasLeft(true);
      toast.info("Left the video consultation");
      recordDuration();
      if (onLeave) {
        onLeave();
      }
    }
  }, [callingState, hasLeft, onLeave, recordDuration]);

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
    try {
      if (call) {
        await call.leave();
      }
    } catch (error) {
      console.error("Failed to leave call:", error);
    } finally {
      recordDuration();
      if (onLeave) {
        onLeave();
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

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

	return (
		<div className="w-full h-full flex flex-col">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Video Consultation</h1>
        <p className="text-muted-foreground">Powered by Stream.io Professional Video</p>
        <p className="text-sm text-emerald-400 mt-2">Connected as {userName}</p>
        <div className="mt-2">
          <span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs">
            {remoteParticipants.length + 1} Participants
          </span>
        </div>
        {elapsedSeconds > 0 && (
          <div className="mt-2 flex justify-center">
            <span className="bg-black/40 text-emerald-100 px-3 py-1 rounded-full text-xs font-mono">
              Call time: {formattedTime}
            </span>
          </div>
        )}
      </div>

			<div className="flex-1 rounded-2xl overflow-hidden border border-emerald-900/40 bg-black">
        <div className="relative w-full h-full">
          {primaryRemote ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ParticipantView
                participant={primaryRemote}
                className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-contain [&_video]:object-center"
              />
              <div className="absolute left-4 bottom-4 bg-black/60 rounded-full px-3 py-1">
                <p className="text-white text-xs sm:text-sm font-medium">
                  {primaryRemote.name || "Participant"}
                </p>
              </div>
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

					{localParticipant && (
						<div
							className={`absolute ${
								isLandscape
									? "right-4 top-4"
									: "right-3 bottom-3 sm:right-4 sm:bottom-4"
							} w-28 h-40 sm:w-32 sm:h-44 md:w-40 md:h-56 rounded-xl overflow-hidden border border-white/40 bg-black/70 shadow-lg`}
						>
              <ParticipantView
                participant={localParticipant}
                className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-contain [&_video]:object-center"
              />
              <div className="absolute left-2 bottom-2 bg-black/60 rounded-full px-2 py-1">
                <p className="text-white text-[10px] sm:text-xs">You</p>
              </div>
            </div>
          )}

					<div
						className={
							isLandscape
								? "absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
								: "absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 sm:gap-4 px-4"
						}
					>
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${isAudioMuted ? "bg-red-600" : "bg-gray-900/80"} text-white hover:opacity-90 transition-opacity shadow-lg`}
              title={isAudioMuted ? "Turn on microphone" : "Turn off microphone"}
            >
              {isAudioMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V6a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V6a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${isVideoMuted ? "bg-red-600" : "bg-gray-900/80"} text-white hover:opacity-90 transition-opacity shadow-lg`}
              title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            <button
              onClick={leaveCall}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg"
            >
              End Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StreamVideoFinal({ callId, appointmentId, userId, userName, apiKey, token }) {
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

				const streamClient = new StreamVideoClient({
					apiKey,
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
	}, [apiKey, token, callId, userId, userName]);

  useEffect(() => {
    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [call, client]);

  const handleLeaveCall = () => {
    if (call) {
      call
        .leave()
        .catch(() => {})
        .finally(() => {
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
		      appointmentId={appointmentId}
		      userId={userId}
		      userName={userName}
		      onLeave={handleLeaveCall}
		    />
		  </StreamCall>
		</StreamVideo>
  );
}
