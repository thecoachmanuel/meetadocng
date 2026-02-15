"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StreamChat } from "stream-chat";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  useCall,
  useCallStateHooks,
  ParticipantView,
  CallingState,
} from "@stream-io/video-react-sdk";

function VideoCallUI({ userId, userName, callId, userRole, apiKey, userToken }) {
  const router = useRouter();
  const call = useCall();
  const { useCallCallingState, useLocalParticipant, useRemoteParticipants } = useCallStateHooks();

  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [chatChannel, setChatChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const isDoctor = userRole === "DOCTOR";
  const localRoleLabel = isDoctor ? "Doctor (you)" : "Patient (you)";
  const remoteRoleLabel = isDoctor ? "Patient" : "Doctor";

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

  useEffect(() => {
    if (!apiKey || !userToken || !userId) return;

    let cancelled = false;
    const client = StreamChat.getInstance(apiKey);

    const setupChat = async () => {
      let subscription;
      try {
        await client.connectUser({ id: userId, name: userName }, userToken);

        if (cancelled) return;

        const channel = client.channel("messaging", `call-${callId}`, {
          members: [userId],
        });

        await channel.watch();

        if (cancelled) {
          await client.disconnectUser();
          return;
        }

        setChatChannel(channel);
        setMessages(channel.state?.messages || []);

        subscription = channel.on("message.new", (event) => {
          if (!event.message) return;
          setMessages((prev) => [...prev, event.message]);
        });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    };

    let cleanup;
    setupChat()
      .then((fn) => {
        cleanup = fn;
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      setChatChannel(null);
      if (typeof cleanup === "function") {
        cleanup();
      }
      client.disconnectUser().catch(() => undefined);
    };
  }, [apiKey, userToken, userId, userName, callId]);

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

  const handleEndCall = async () => {
    try {
      if (call) {
        try {
          if (!isVideoMuted) {
            await call.camera.toggle();
          }
        } catch (error) {
          console.error("Failed to disable camera on end call:", error);
        }

        try {
          if (!isAudioMuted) {
            await call.microphone.toggle();
          }
        } catch (error) {
          console.error("Failed to mute microphone on end call:", error);
        }

        setIsVideoMuted(true);
        setIsAudioMuted(true);

        try {
          await call.leave();
        } catch (error) {
          console.error("Failed to leave call:", error);
        }
      }
    } finally {
      router.push("/appointments");
    }
  };

  if (isConnecting) {
    return (
      <div className="container mx-auto px-4 py-10 md:py-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Connecting to Video Consultation</h1>
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
    <div className="container mx-auto px-4 py-4 md:py-6 h-[100dvh] flex flex-col">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Video Consultation</h1>
          <p className="text-muted-foreground text-sm md:text-base">Powered by Stream.io Professional Video</p>
          <p className="text-sm text-emerald-400 mt-1">Connected as {userName}</p>
          <p className="text-xs md:text-sm text-emerald-300 mt-1">
            {isDoctor ? "You are joining as the doctor" : "You are joining as the patient"}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground gap-2">
          <span className="bg-emerald-600/20 text-emerald-300 px-2 py-1 rounded-md border border-emerald-700/40">
            {remoteParticipants.length + 1} participant{remoteParticipants.length ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-200">
              {localRoleLabel}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-200">
              {remoteRoleLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 rounded-lg overflow-hidden border border-emerald-900/30 bg-black">
          <div className="relative w-full h-full">
            {remoteParticipants.length > 0 ? (
              <div className="grid gap-2 p-2 h-full w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {remoteParticipants.map((participant) => (
                  <div key={participant.userId} className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <ParticipantView
                      participant={participant}
                      className="w-full h-full min-h-[160px] sm:min-h-[200px] md:min-h-[260px] object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1">
                      <p className="text-white text-xs font-medium">
                        {`${remoteRoleLabel}: ${participant.name || "Participant"}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-white font-medium text-base sm:text-lg">Waiting for participant...</p>
                  <p className="text-gray-400 text-sm mt-2">Remote video will appear here once they join</p>
                </div>
              </div>
            )}

            {localParticipant && (
              <div className="absolute top-4 right-4 sm:bottom-4 sm:right-4 sm:top-auto w-28 h-40 sm:w-40 sm:h-56 rounded-lg overflow-hidden border border-gray-700 bg-gray-900/70 shadow-lg">
                <ParticipantView
                  participant={localParticipant}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 bg-black/60 rounded px-2 py-0.5">
                  <p className="text-white text-[10px] font-medium">{localRoleLabel}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex w-80 flex-col rounded-lg border border-emerald-900/30 bg-slate-950/80">
          <div className="border-b border-emerald-900/40 px-3 py-2">
            <p className="text-sm font-medium text-white">Doctor–Patient Chat</p>
            <p className="text-[11px] text-slate-400">Chat is only visible to participants in this consultation.</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 text-sm">
            {messages.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">No messages yet. Start the conversation here.</p>
            )}
            {messages.map((message) => {
              const isOwn = message.user?.id === userId;
              const label = isOwn ? localRoleLabel : remoteRoleLabel;

              return (
                <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-2 py-1 text-xs ${
                    isOwn ? "bg-emerald-700/80 text-white" : "bg-slate-800 text-slate-50"
                  }`}>
                    <div className="text-[10px] text-emerald-200 mb-0.5">{label}</div>
                    <div className="break-words">{message.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-emerald-900/40 px-3 py-2 flex items-center gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!chatChannel || !newMessage.trim()) return;
                  const text = newMessage.trim();
                  setNewMessage("");
                  try {
                    await chatChannel.sendMessage({ text });
                  } catch (error) {
                    console.error("Failed to send message:", error);
                    toast.error("Failed to send message");
                  }
                }
              }}
              placeholder="Type a message"
              className="flex-1 bg-slate-900/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={!chatChannel}
            />
            <button
              type="button"
              className="px-3 py-1 rounded-md bg-emerald-600 text-xs font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!chatChannel || !newMessage.trim()}
              onClick={async () => {
                if (!chatChannel || !newMessage.trim()) return;
                const text = newMessage.trim();
                setNewMessage("");
                try {
                  await chatChannel.sendMessage({ text });
                } catch (error) {
                  console.error("Failed to send message:", error);
                  toast.error("Failed to send message");
                }
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 md:p-4 flex flex-wrap items-center justify-center gap-3 bg-muted/30 border border-emerald-900/30 rounded-lg">
        <button
          onClick={toggleAudio}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isAudioMuted ? "bg-red-600 text-white" : "bg-gray-900 text-white"
          }`}
          title={isAudioMuted ? "Turn on microphone" : "Turn off microphone"}
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
          <span>{isAudioMuted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isVideoMuted ? "bg-red-600 text-white" : "bg-gray-900 text-white"
          }`}
          title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
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
          <span>{isVideoMuted ? "Start video" : "Stop video"}</span>
        </button>

        <button
          onClick={handleEndCall}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9l-2-2m0 0l2-2m-2 2h8m-3 13a9 9 0 110-18 9 9 0 010 18z" />
          </svg>
          <span>End call</span>
        </button>
      </div>
    </div>
  );
}

export default function StreamVideoFinal({ callId, userId, userName, userRole }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [apiKey, setApiKey] = useState(null);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    let activeClient = null;
    let activeCall = null;
    let cancelled = false;

    const initializeStream = async () => {
      try {
        setIsInitializing(true);

        const user = {
          id: userId,
          name: userName,
          image: `https://getstream.io/random_svg/?id=${userId}&name=${encodeURIComponent(userName)}`,
        };

        const tokenResponse = await fetch("/api/stream/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            callId: String(callId),
            userId: String(userId),
            userName,
          }),
        });

        if (!tokenResponse.ok) {
          const data = await tokenResponse.json().catch(() => ({}));
          throw new Error(data.error || "Failed to obtain video token");
        }

        const { token, apiKey: receivedApiKey } = await tokenResponse.json();

        activeClient = new StreamVideoClient({
          apiKey: receivedApiKey,
          user,
          token,
        });

        activeCall = activeClient.call("default", String(callId));
        await activeCall.join({ create: true });

        if (cancelled) {
          await activeCall.leave().catch(() => undefined);
          await activeClient.disconnectUser().catch(() => undefined);
          return;
        }

        setClient(activeClient);
        setCall(activeCall);
        setApiKey(receivedApiKey);
        setUserToken(token);
        setIsInitializing(false);

        toast.success("Connected to Stream.io video service!");
      } catch (error) {
        console.error("Failed to initialize Stream.io:", error);
        const message = error && typeof error.message === "string"
          ? error.message
          : "Failed to connect to video service";
        setErrorMessage(message);
        toast.error(message);
        setIsInitializing(false);
      }
    };

    initializeStream();

    return () => {
      cancelled = true;
      if (activeCall) {
        activeCall.leave().catch(() => undefined);
      }
      if (activeClient) {
        activeClient.disconnectUser().catch(() => undefined);
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
        <p className="text-muted-foreground mb-2">Unable to connect to Stream.io video service.</p>
        {errorMessage && (
          <p className="text-xs text-red-300 mb-4 break-words max-w-xl mx-auto">{errorMessage}</p>
        )}
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
          userRole={userRole}
          apiKey={apiKey}
          userToken={userToken}
        />
      </StreamCall>
    </StreamVideo>
  );
}
