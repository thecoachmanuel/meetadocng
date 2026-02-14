/**
 * WebRTC Peer Connection for video calling
 * Handles peer-to-peer video communication
 */

export class WebRTCPeer {
  constructor(roomId, userId) {
    this.roomId = roomId;
    this.userId = userId;
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isConnected = false;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
  }

  /**
   * Initialize WebRTC connection
   */
  async initialize() {
    try {
      // Get user media (camera and microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({
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

      // Create peer connection with STUN servers
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.isConnected = true;
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real implementation, this would be sent to the other peer
          console.log('ICE candidate:', event.candidate);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', this.peerConnection.connectionState);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(this.peerConnection.connectionState);
        }
      };

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      };

      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  /**
   * Create offer for connection
   */
  async createOffer() {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create answer for connection
   */
  async createAnswer() {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description) {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.setRemoteDescription(description);
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate) {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.addIceCandidate(candidate);
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
    return this.peerConnection?.connectionState || 'new';
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    this.isConnected = false;
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

/**
 * Simple signaling for WebRTC (simulation)
 */
export class SimpleSignaling {
  constructor(roomId) {
    this.roomId = roomId;
    this.peers = new Map();
    this.onOffer = null;
    this.onAnswer = null;
    this.onIceCandidate = null;
  }

  /**
   * Simulate sending offer to peer
   */
  async sendOffer(offer, toPeerId) {
    console.log('Sending offer to peer:', toPeerId, offer);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  /**
   * Simulate sending answer to peer
   */
  async sendAnswer(answer, toPeerId) {
    console.log('Sending answer to peer:', toPeerId, answer);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  /**
   * Simulate sending ICE candidate to peer
   */
  async sendIceCandidate(candidate, toPeerId) {
    console.log('Sending ICE candidate to peer:', toPeerId, candidate);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
  }
}