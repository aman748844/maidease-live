// Real-Time WebRTC Peer-to-Peer Audio Call Service (Urban Company / Uber style)
import { realtime } from './realtime';
import { API_BASE } from './api';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
    this.activeCallId = null;
    this.onRemoteStreamCallback = null;
    this.onCallEndCallback = null;

    // STUN configuration
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    // Listen to incoming WebRTC signals from server
    realtime.on('webrtc_signal', (payload) => {
      this.handleIncomingSignal(payload);
    });
  }

  async getLocalMicrophoneStream() {
    if (this.localStream) return this.localStream;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      return this.localStream;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      return null;
    }
  }

  createPeerConnection(callId) {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.activeCallId = callId;
    const pc = new RTCPeerConnection(this.config);

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalToServer(callId, 'candidate', event.candidate);
      }
    };

    // Remote audio track handler
    pc.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.remoteAudio.srcObject = this.remoteStream;
      this.remoteAudio.play().catch(console.error);
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Add local microphone tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    this.peerConnection = pc;
    return pc;
  }

  async initiateCall(callId, maidId, customerName = 'Customer in Pune') {
    await this.getLocalMicrophoneStream();
    const pc = this.createPeerConnection(callId);

    // Alert server & maid of outgoing call
    await fetch(`${API_BASE}/webrtc/call-maid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, maidId, customerName })
    });

    // Create and send WebRTC SDP Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.sendSignalToServer(callId, 'offer', offer);
  }

  async answerIncomingCall(callId) {
    await this.getLocalMicrophoneStream();
    const pc = this.createPeerConnection(callId);

    await fetch(`${API_BASE}/webrtc/answer-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId })
    });
  }

  async handleIncomingSignal({ callId, type, signal, sender }) {
    if (!this.peerConnection || this.activeCallId !== callId) return;

    try {
      if (type === 'offer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        await this.sendSignalToServer(callId, 'answer', answer);
      } else if (type === 'answer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (type === 'candidate') {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal));
      }
    } catch (e) {
      console.error('Error handling WebRTC signal:', e);
    }
  }

  async sendSignalToServer(callId, type, signal) {
    try {
      await fetch(`${API_BASE}/webrtc/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, type, signal })
      });
    } catch (e) {
      console.error('Signal sending error:', e);
    }
  }

  toggleMute(isMuted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }

  endCall(callId) {
    const id = callId || this.activeCallId;
    if (id) {
      fetch(`${API_BASE}/webrtc/end-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: id })
      }).catch(console.error);
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    this.remoteAudio.pause();
    this.remoteAudio.srcObject = null;
    this.activeCallId = null;

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }
  }
}

export const webrtc = new WebRTCService();
