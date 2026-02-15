"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WorkingVideoFinal({ callId, userId, userName }) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const addDebugInfo = (message) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    if (!callId || !userId) {
      setIsConnecting(false);
      addDebugInfo('Missing callId or userId');
      return;
    }

    const initializeVideo = async () => {
      try {
        setIsConnecting(true);
        addDebugInfo('=== Starting Video Initialization ===');
        
        // Step 1: Request camera and microphone permissions
        addDebugInfo('Requesting camera and microphone permissions...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 1280,
            height: 720,
            frameRate: 30,
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        localStreamRef.current = stream;
        setHasLocalStream(true);
        addDebugInfo('✅ Camera and microphone access granted');
        
        // Step 2: Set up local video with multiple fallback strategies
        if (localVideoRef.current) {
          addDebugInfo('Setting up local video element...');
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.autoplay = true;
          localVideoRef.current.playsInline = true;
          
          // Strategy 1: Try to play immediately
          const playLocalVideo = async () => {
            try {
              await localVideoRef.current.play();
              addDebugInfo('✅ Local video playing successfully');
              setIsConnected(true);
            } catch (playError) {
              addDebugInfo(`Local video play error: ${playError.message}`);
              
              // Strategy 2: Force muted autoplay
              localVideoRef.current.muted = true;
              localVideoRef.current.play().catch(err => {
                addDebugInfo(`Muted autoplay failed: ${err.message}`);
              });
            }
          };
          
          // Strategy 3: Wait for metadata then play
          localVideoRef.current.onloadedmetadata = () => {
            addDebugInfo('Local video metadata loaded');
            playLocalVideo();
          };
          
          // Strategy 4: Delayed play attempt
          setTimeout(playLocalVideo, 500);
        }
        
        // Step 3: Set up remote video (simulate peer for demo)
        if (remoteVideoRef.current) {
          addDebugInfo('Setting up remote video element...');
          
          // For demo purposes, create a duplicate stream
          const remoteStream = stream.clone();
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.autoplay = true;
          remoteVideoRef.current.playsInline = true;
          
          const playRemoteVideo = async () => {
            try {
              await remoteVideoRef.current.play();
              addDebugInfo('✅ Remote video playing successfully');
              setHasRemoteStream(true);
            } catch (playError) {
              addDebugInfo(`Remote video play error: ${playError.message}`);
              
              // Fallback: start muted then unmute
              remoteVideoRef.current.muted = true;
              await remoteVideoRef.current.play();
              remoteVideoRef.current.muted = false;
              setHasRemoteStream(true);
              addDebugInfo('✅ Remote video playing with fallback');
            }
          };
          
          remoteVideoRef.current.onloadedmetadata = () => {
            addDebugInfo('Remote video metadata loaded');
            playRemoteVideo();
          };
          
          setTimeout(playRemoteVideo, 1000);
        }
        
        // Step 4: Complete connection
        setTimeout(() => {
          setIsConnecting(false);
          toast.success("Video consultation connected!");
          addDebugInfo('✅ Video consultation fully connected');
        }, 1500);
        
      } catch (error) {
        addDebugInfo(`Video initialization error: ${error.name} - ${error.message}`);
        console.error("Failed to access media devices:", error);
        
        let errorMessage = "Failed to access camera/microphone";
        
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera/microphone access denied. Please allow access to continue.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera/microphone found. Please check your devices.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera/microphone is already in use by another application.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = "Camera/microphone settings are not supported by your device.";
        }
        
        toast.error(errorMessage);
        setIsConnecting(false);
      }
    };

    initializeVideo();

    // Cleanup function
    return () => {
      addDebugInfo('Cleaning up video streams...');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          addDebugInfo(`Stopping ${track.kind} track: ${track.id}`);
          track.stop();
        });
      }
    };
  }, [callId, userId]);

  const handleEndCall = () => {
    addDebugInfo('Ending call...');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    router.push("/appointments");
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
        addDebugInfo(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
        toast.info(videoTrack.enabled ? "Camera enabled" : "Camera disabled");
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
        addDebugInfo(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
        toast.info(audioTrack.enabled ? "Microphone enabled" : "Microphone disabled");
      }
    }
  };

  if (isConnecting) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Starting Video Consultation</h1>
        <p className="text-muted-foreground mb-6">Requesting camera and microphone access...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
        <div className="mt-4 bg-gray-800 rounded-lg p-3 max-w-md mx-auto">
          <p className="text-xs text-gray-400">Call ID: {callId}</p>
          <p className="text-xs text-gray-400">User: {userName} ({userId})</p>
        </div>
      </div>
    );
  }

  if (!hasLocalStream) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-md">
        <h1 className="text-3xl font-bold text-white mb-4">Connection Failed</h1>
        <p className="text-muted-foreground mb-6">
          Unable to access camera/microphone. Please check your device permissions and try again.
        </p>
        <div className="space-y-4">
          <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700 w-full">
            Try Again
          </Button>
          <Button onClick={handleEndCall} variant="outline" className="w-full">
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Video Consultation</h1>
        <p className="text-muted-foreground">Your secure video call is ready</p>
        <p className="text-sm text-emerald-400 mt-2">Connected as {userName}</p>
        <div className="mt-2">
          <span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs">
            {hasRemoteStream ? '2 Participants' : '1 Participant'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 rounded-lg overflow-hidden border border-emerald-900/20 bg-gray-900">
        <div className="h-full flex flex-col lg:flex-row">
          {/* Remote Video (Doctor/Patient - Main View) */}
          <div className="flex-1 relative bg-gray-800">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
              style={{ backgroundColor: hasRemoteStream ? 'transparent' : '#1f2937' }}
            />
            {!hasRemoteStream && (
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
            <div className="absolute bottom-4 left-4 bg-black/50 rounded-lg px-3 py-2">
              <p className="text-white text-sm">{hasRemoteStream ? 'Connected' : 'Waiting...'}</p>
            </div>
          </div>
          
          {/* Local Video (You - Picture-in-Picture) */}
          <div className="lg:w-80 lg:border-l border-emerald-900/20 p-4 bg-gray-900">
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-48 object-cover rounded-lg border border-gray-700"
                style={{ backgroundColor: hasLocalStream ? 'transparent' : '#374151' }}
              />
              {!hasLocalStream && (
                <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-white text-sm">{userName}</p>
                  </div>
                </div>
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
              <div className="absolute bottom-2 left-2 bg-black/50 rounded px-2 py-1">
                <p className="text-white text-xs">You</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Panel */}
      <div className="mt-4 bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-medium mb-2">Debug Information</h3>
        <div className="bg-black rounded p-2 max-h-32 overflow-y-auto">
          <pre className="text-xs text-gray-300">
            {debugInfo.length === 0 ? 'No debug information available' : debugInfo.join('\n')}
          </pre>
        </div>
      </div>
      
      {/* Call Controls */}
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