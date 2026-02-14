/**
 * WebRTC Signaling Server for Real-time Video Communication
 * Handles peer-to-peer connection establishment between doctor and patient
 */

export class WebRTCSignaling {
  constructor(roomId, userId, userName) {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    this.localPeerConnection = null;
    this.remotePeerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isInitiator = false;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
    
    // WebSocket connection (simulated for now)
    this.websocket = null;
    this.otherPeerId = null;
  }

  /**
   * Initialize WebRTC connection with proper signaling
   */
  async initialize() {
    try {
      // Get user media with optimal settings
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        }
      });

      // Create peer connection with proper configuration
      this.localPeerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.localPeerConnection.addTrack(track, this.localStream);
      });

      // Handle remote stream
      this.localPeerConnection.ontrack = (event) => {
        console.log('Remote stream received:', event);
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      };

      // Handle ICE candidates
      this.localPeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendIceCandidate(event.candidate);
        }
      };

      // Handle connection state changes
      this.localPeerConnection.onconnectionstatechange = () => {
        const state = this.localPeerConnection.connectionState;
        console.log('Connection state:', state);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
      };

      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  /**
   * Create and send offer to other peer
   */
  async createOffer() {
    try {
      const offer = await this.localPeerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.localPeerConnection.setLocalDescription(offer);
      this.sendOffer(offer);
      
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  /**
   * Handle offer from other peer
   */
  async handleOffer(offer) {
    try {
      await this.localPeerConnection.setRemoteDescription(offer);
      const answer = await this.localPeerConnection.createAnswer();
      await this.localPeerConnection.setLocalDescription(answer);
      this.sendAnswer(answer);
      
      return answer;
    } catch (error) {
      console.error('Failed to handle offer:', error);
      throw error;
    }
  }

  /**
   * Handle answer from other peer
   */
  async handleAnswer(answer) {
    try {
      await this.localPeerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  /**
   * Handle ICE candidate from other peer
   */
  async handleIceCandidate(candidate) {
    try {
      await this.localPeerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      throw error;
    }
  }

  /**
   * Toggle video
   */
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Toggle audio
   */
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Get local stream
   */
  getLocalStream() {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream() {
    return this.remoteStream;
  }

  /**
   * Get connection state
   */
  getConnectionState() {
    return this.localPeerConnection?.connectionState || 'new';
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    if (this.localPeerConnection) {
      this.localPeerConnection.close();
      this.localPeerConnection = null;
    }
  }

  /**
   * Simulate signaling (for demo purposes)
   * In production, this would use WebSocket or similar
   */
  sendOffer(offer) {
    console.log('Sending offer:', offer);
    // Simulate network delay
    setTimeout(() => {
      this.simulatePeerResponse(offer);
    }, 1000);
  }

  sendAnswer(answer) {
    console.log('Sending answer:', answer);
  }

  sendIceCandidate(candidate) {
    console.log('Sending ICE candidate:', candidate);
  }

  /**
   * Simulate peer response (for demo)
   */
  async simulatePeerResponse(offer) {
    // Simulate the other peer creating an answer
    try {
      const remotePC = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // Add a simulated remote stream (could be from another camera or screen share)
      const remoteStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera for demo
        audio: true
      });

      remoteStream.getTracks().forEach(track => {
        remotePC.addTrack(track, remoteStream);
      });

      await remotePC.setRemoteDescription(offer);
      const answer = await remotePC.createAnswer();
      await remotePC.setLocalDescription(answer);

      // Simulate receiving the answer
      this.handleAnswer(answer);

      // Clean up the simulated peer connection after a delay
      setTimeout(() => {
        remotePC.close();
        remoteStream.getTracks().forEach(track => track.stop());
      }, 5000);

    } catch (error) {
      console.error('Failed to simulate peer response:', error);
    }
  }
}