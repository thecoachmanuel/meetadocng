"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CameraDebug({ callId, userId, userName }) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const [cameraPermission, setCameraPermission] = useState('unknown');
  const [microphonePermission, setMicrophonePermission] = useState('unknown');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const addDebugInfo = (message) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const checkPermissions = async () => {
    try {
      if (!navigator.permissions) {
        addDebugInfo('navigator.permissions not available');
        return;
      }

      const cameraQuery = await navigator.permissions.query({ name: 'camera' });
      const microphoneQuery = await navigator.permissions.query({ name: 'microphone' });
      
      setCameraPermission(cameraQuery.state);
      setMicrophonePermission(microphoneQuery.state);
      
      addDebugInfo(`Camera permission: ${cameraQuery.state}`);
      addDebugInfo(`Microphone permission: ${microphoneQuery.state}`);
      
      cameraQuery.onchange = () => {
        setCameraPermission(cameraQuery.state);
        addDebugInfo(`Camera permission changed: ${cameraQuery.state}`);
      };
      
      microphoneQuery.onchange = () => {
        setMicrophonePermission(microphoneQuery.state);
        addDebugInfo(`Microphone permission changed: ${microphoneQuery.state}`);
      };
    } catch (error) {
      addDebugInfo(`Permission check error: ${error.message}`);
    }
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      addDebugInfo(`Found ${devices.length} media devices:`);
      devices.forEach((device, index) => {
        addDebugInfo(`Device ${index}: ${device.kind} - ${device.label} (${device.deviceId})`);
      });
    } catch (error) {
      addDebugInfo(`Device enumeration error: ${error.message}`);
    }
  };

  const testCameraAccess = async () => {
    try {
      addDebugInfo('=== Testing Camera Access ===');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices) {
        addDebugInfo('ERROR: navigator.mediaDevices not available');
        addDebugInfo('Browser support: ' + (navigator.mediaDevices ? 'Yes' : 'No'));
        throw new Error('Media devices not supported');
      }

      // Check HTTPS requirement
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        addDebugInfo('WARNING: Not using HTTPS - camera access may be blocked');
      }

      // Check iframe permissions
      if (window.self !== window.top) {
        addDebugInfo('WARNING: Running in iframe - may need allow="camera; microphone"');
      }

      // Test with minimal constraints first
      addDebugInfo('Testing with minimal video constraints...');
      const minimalStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      addDebugInfo('SUCCESS: Minimal video access granted');
      minimalStream.getTracks().forEach(track => track.stop());

      // Test with optimal constraints
      addDebugInfo('Testing with optimal video constraints...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
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
      
      // Analyze the stream
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      addDebugInfo(`Video tracks: ${videoTracks.length}`);
      addDebugInfo(`Audio tracks: ${audioTracks.length}`);
      
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        const settings = videoTrack.getSettings();
        addDebugInfo(`Video settings: ${JSON.stringify(settings, null, 2)}`);
        addDebugInfo(`Video readyState: ${videoTrack.readyState}`);
        addDebugInfo(`Video enabled: ${videoTrack.enabled}`);
        addDebugInfo(`Video muted: ${videoTrack.muted}`);
      }
      
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        const settings = audioTrack.getSettings();
        addDebugInfo(`Audio settings: ${JSON.stringify(settings, null, 2)}`);
        addDebugInfo(`Audio readyState: ${audioTrack.readyState}`);
        addDebugInfo(`Audio enabled: ${audioTrack.enabled}`);
        addDebugInfo(`Audio muted: ${audioTrack.muted}`);
      }
      
      // Set up video elements
      if (localVideoRef.current) {
        addDebugInfo('Setting up local video element...');
        localVideoRef.current.srcObject = stream;
        
        // Add event listeners
        localVideoRef.current.onloadedmetadata = () => {
          addDebugInfo('Local video metadata loaded');
          addDebugInfo(`Video dimensions: ${localVideoRef.current.videoWidth}x${localVideoRef.current.videoHeight}`);
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
        
        // Try to play
        localVideoRef.current.play().then(() => {
          addDebugInfo('Local video playing successfully');
          setIsConnected(true);
        }).catch((error) => {
          addDebugInfo(`Failed to play local video: ${error.message}`);
        });
      }
      
      // Set up remote video (simulate peer)
      if (remoteVideoRef.current) {
        addDebugInfo('Setting up remote video element...');
        remoteVideoRef.current.srcObject = stream; // For demo, use same stream
        
        remoteVideoRef.current.onloadedmetadata = () => {
          addDebugInfo('Remote video metadata loaded');
        };
        
        remoteVideoRef.current.onplay = () => {
          addDebugInfo('Remote video started playing');
          setHasRemoteStream(true);
        };
        
        remoteVideoRef.current.play().catch((error) => {
          addDebugInfo(`Failed to play remote video: ${error.message}`);
        });
      }
      
      setIsConnecting(false);
      toast.success("Camera and microphone access successful!");
      
    } catch (error) {
      addDebugInfo(`Camera access error: ${error.name} - ${error.message}`);
      console.error('Camera access error:', error);
      
      let errorMessage = "Failed to access camera/microphone";
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = "Camera/microphone access denied. Please allow access to continue.";
          break;
        case 'NotFoundError':
          errorMessage = "No camera/microphone found. Please check your devices.";
          break;
        case 'NotReadableError':
          errorMessage = "Camera/microphone is already in use by another application.";
          break;
        case 'OverconstrainedError':
          errorMessage = "Camera/microphone settings are not supported by your device.";
          break;
        case 'AbortError':
          errorMessage = "Camera/microphone access was aborted.";
          break;
        case 'SecurityError':
          errorMessage = "Camera/microphone access blocked by security settings.";
          break;
        case 'TypeError':
          errorMessage = "Invalid camera/microphone constraints.";
          break;
        default:
          errorMessage = `Camera/microphone error: ${error.name}`;
      }
      
      toast.error(errorMessage);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const initializeDebug = async () => {
      addDebugInfo('=== Video Call Debug Started ===');
      addDebugInfo(`User Agent: ${navigator.userAgent}`);
      addDebugInfo(`Platform: ${navigator.platform}`);
      addDebugInfo(`Protocol: ${location.protocol}`);
      addDebugInfo(`Hostname: ${location.hostname}`);
      addDebugInfo(`In iframe: ${window.self !== window.top}`);
      
      // Check permissions
      await checkPermissions();
      
      // Enumerate devices
      await enumerateDevices();
      
      // Test camera access
      await testCameraAccess();
    };

    initializeDebug();

    // Cleanup function
    return () => {
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

  const retryCamera = async () => {
    addDebugInfo('=== Retrying Camera Access ===');
    setDebugInfo([]);
    await testCameraAccess();
  };

  if (isConnecting) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Diagnosing Camera & Microphone</h1>
        <p className="text-muted-foreground mb-6">Checking device access and permissions...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Video Consultation</h1>
        <p className="text-muted-foreground">Your secure video call is ready</p>
        <p className="text-sm text-emerald-400 mt-2">Connected as {userName}</p>
        
        {/* Permission Status */}
        <div className="mt-4 flex justify-center gap-4">
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-400">Camera: </span>
            <span className={`text-sm font-medium ${
              cameraPermission === 'granted' ? 'text-green-400' : 
              cameraPermission === 'denied' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {cameraPermission}
            </span>
          </div>
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-400">Microphone: </span>
            <span className={`text-sm font-medium ${
              microphonePermission === 'granted' ? 'text-green-400' : 
              microphonePermission === 'denied' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {microphonePermission}
            </span>
          </div>
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
                  <p className="text-white font-medium">{hasLocalStream ? 'Remote Participant' : 'Connecting...'}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {hasLocalStream ? 'Remote video will appear here' : 'Waiting for camera access'}
                  </p>
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
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-medium">Debug Information</h3>
          <Button onClick={retryCamera} size="sm" variant="outline" className="text-xs">
            Retry Camera
          </Button>
        </div>
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