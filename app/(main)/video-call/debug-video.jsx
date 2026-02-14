"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DebugVideo({ callId, userId, userName }) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [debugInfo, setDebugInfo] = useState('');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const addDebugInfo = (message) => {
    setDebugInfo(prev => prev + '\n' + message);
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
        addDebugInfo('Starting video initialization...');
        
        // Check if mediaDevices is available
        if (!navigator.mediaDevices) {
          addDebugInfo('navigator.mediaDevices not available');
          throw new Error('Media devices not supported in this browser');
        }
        
        addDebugInfo('Requesting media permissions...');
        
        // Request camera and microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        localStreamRef.current = stream;
        addDebugInfo('Media stream obtained successfully');
        
        // Check what devices we have
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        
        addDebugInfo(`Video tracks: ${videoTracks.length}`);
        addDebugInfo(`Audio tracks: ${audioTracks.length}`);
        
        if (videoTracks.length > 0) {
          addDebugInfo(`Video track settings: ${JSON.stringify(videoTracks[0].getSettings())}`);
          addDebugInfo(`Video track readyState: ${videoTracks[0].readyState}`);
          addDebugInfo(`Video track enabled: ${videoTracks[0].enabled}`);
          addDebugInfo(`Video track muted: ${videoTracks[0].muted}`);
        }
        
        if (audioTracks.length > 0) {
          addDebugInfo(`Audio track settings: ${JSON.stringify(audioTracks[0].getSettings())}`);
          addDebugInfo(`Audio track readyState: ${audioTracks[0].readyState}`);
          addDebugInfo(`Audio track enabled: ${audioTracks[0].enabled}`);
          addDebugInfo(`Audio track muted: ${audioTracks[0].muted}`);
        }
        
        setHasLocalStream(true);
        
        // Set up local video with detailed debugging
        if (localVideoRef.current) {
          addDebugInfo('Setting up local video element...');
          localVideoRef.current.srcObject = stream;
          
          // Add event listeners for debugging
          localVideoRef.current.onloadedmetadata = () => {
            addDebugInfo('Local video metadata loaded');
            addDebugInfo(`Local video dimensions: ${localVideoRef.current.videoWidth}x${localVideoRef.current.videoHeight}`);
            addDebugInfo(`Local video duration: ${localVideoRef.current.duration}`);
          };
          
          localVideoRef.current.onplay = () => {
            addDebugInfo('Local video started playing');
          };
          
          localVideoRef.current.onerror = (e) => {
            addDebugInfo(`Local video error: ${e.message}`);
          };
          
          localVideoRef.current.onloadeddata = () => {
            addDebugInfo('Local video data loaded');
          };
          
          // Try to play the video
          localVideoRef.current.play().then(() => {
            addDebugInfo('Local video playing successfully');
          }).catch((error) => {
            addDebugInfo(`Failed to play local video: ${error.message}`);
          });
        } else {
          addDebugInfo('Local video ref is null');
        }
        
        // Create peer connection with STUN servers
        addDebugInfo('Creating peer connection...');
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ],
          iceCandidatePoolSize: 10
        });
        
        peerConnectionRef.current = pc;
        addDebugInfo('Peer connection created successfully');
        
        // Add local stream to peer connection
        addDebugInfo('Adding tracks to peer connection...');
        stream.getTracks().forEach(track => {
          addDebugInfo(`Adding ${track.kind} track: ${track.id}`);
          pc.addTrack(track, stream);
        });
        
        // Handle remote stream
        pc.ontrack = (event) => {
          addDebugInfo('Remote track event received');
          addDebugInfo(`Track kind: ${event.track.kind}`);
          addDebugInfo(`Track id: ${event.track.id}`);
          addDebugInfo(`Number of streams: ${event.streams.length}`);
          
          if (remoteVideoRef.current && event.streams[0]) {
            addDebugInfo('Setting remote video stream');
            remoteVideoRef.current.srcObject = event.streams[0];
            
            // Add debugging for remote video
            remoteVideoRef.current.onloadedmetadata = () => {
              addDebugInfo('Remote video metadata loaded');
              addDebugInfo(`Remote video dimensions: ${remoteVideoRef.current.videoWidth}x${remoteVideoRef.current.videoHeight}`);
            };
            
            remoteVideoRef.current.onplay = () => {
              addDebugInfo('Remote video started playing');
              setHasRemoteStream(true);
              setIsConnected(true);
            };
            
            remoteVideoRef.current.onerror = (e) => {
              addDebugInfo(`Remote video error: ${e.message}`);
            };
            
            remoteVideoRef.current.play().then(() => {
              addDebugInfo('Remote video playing successfully');
            }).catch((error) => {
              addDebugInfo(`Failed to play remote video: ${error.message}`);
            });
          }
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addDebugInfo(`ICE candidate: ${event.candidate.candidate}`);
          }
        };
        
        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          addDebugInfo(`Connection state changed: ${state}`);
          setConnectionState(state);
          
          if (state === 'connected') {
            setIsConnected(true);
            addDebugInfo('Connection established successfully');
          } else if (state === 'failed' || state === 'disconnected') {
            setIsConnected(false);
            addDebugInfo('Connection failed or disconnected');
          }
        };
        
        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
          addDebugInfo(`ICE connection state: ${pc.iceConnectionState}`);
        };
        
        // For demo purposes, simulate a peer connection after 2 seconds
        setTimeout(async () => {
          try {
            addDebugInfo('Creating offer...');
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            
            addDebugInfo('Setting local description...');
            await pc.setLocalDescription(offer);
            addDebugInfo('Local description set successfully');
            
            // Simulate receiving answer from peer
            const simulatedAnswer = {
              type: 'answer',
              sdp: offer.sdp // In real scenario, this would be different
            };
            
            addDebugInfo('Setting remote description...');
            await pc.setRemoteDescription(simulatedAnswer);
            addDebugInfo('Remote description set successfully');
            
            setIsConnecting(false);
            toast.success("Video call connected successfully!");
            addDebugInfo('Video call connection completed');
            
          } catch (error) {
            addDebugInfo(`Failed to establish connection: ${error.message}`);
            setIsConnecting(false);
          }
        }, 2000);
        
      } catch (error) {
        addDebugInfo(`Failed to initialize video: ${error.message}`);
        console.error("Failed to initialize WebRTC:", error);
        
        if (error.name === 'NotAllowedError') {
          toast.error("Camera/microphone access denied. Please allow access to continue.");
        } else if (error.name === 'NotFoundError') {
          toast.error("No camera/microphone found. Please check your devices.");
        } else if (error.name === 'NotReadableError') {
          toast.error("Camera/microphone is already in use by another application.");
        } else {
          toast.error("Failed to access camera/microphone. Please check permissions.");
        }
        
        setIsConnecting(false);
      }
    };

    initializeVideo();

    // Cleanup function
    return () => {
      addDebugInfo('Cleaning up video connection...');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          addDebugInfo(`Stopping ${track.kind} track: ${track.id}`);
          track.stop();
        });
      }
      if (peerConnectionRef.current) {
        addDebugInfo('Closing peer connection');
        peerConnectionRef.current.close();
      }
    };
  }, [callId, userId]);

  const handleEndCall = () => {
    addDebugInfo('Ending call...');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
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

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Video Consultation</h1>
        <p className="text-muted-foreground">Your secure video call is ready</p>
        <p className="text-sm text-emerald-400 mt-2">Connected as {userName}</p>
        <p className="text-xs text-gray-400 mt-1">Connection: {connectionState}</p>
      </div>
      
      <div className="flex-1 rounded-lg overflow-hidden border border-emerald-900/20 bg-gray-900">
        <div className="h-full flex flex-col lg:flex-row">
          {/* Remote Video */}
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
              <p className="text-white text-sm">Remote Participant</p>
            </div>
          </div>
          
          {/* Local Video (Picture-in-Picture) */}
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
        <pre className="text-xs text-gray-300 overflow-auto max-h-32">
          {debugInfo || 'No debug information available'}
        </pre>
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