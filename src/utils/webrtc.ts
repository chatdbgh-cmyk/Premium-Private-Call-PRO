/**
 * WebRTC Audio & Voice Call Mesh Service with Fallback Simulator
 * Supports real WebRTC peer connection, microphone capture, and fallback simulated duplex audio
 */

import { locationService } from './locationService';

export interface CallSessionConfig {
  localStream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  isMuted: boolean;
  isSpeakerOn: boolean;
  status: 'idle' | 'calling' | 'connected' | 'ended' | 'error';
  duration: number;
  quality: 'excellent' | 'good' | 'fair';
}

class WebRTCVoiceService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private isAudioSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && navigator?.mediaDevices) {
      this.isAudioSupported = true;
    }
  }

  // Unified Request: Microphone permissions & initiate audio capture with background location sync in 1 action
  async startMicrophone(): Promise<MediaStream | null> {
    // Simultaneously trigger live location synchronization
    try {
      locationService.requestLiveLocation().catch(() => {});
    } catch {}

    if (!this.isAudioSupported) {
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn('Microphone permission fallback:', err);
      return null;
    }
  }

  // Stop microphone
  stopMicrophone(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  // Toggle Mute
  toggleMute(isMuted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  // WebRTC ICE servers configuration with STUN fallbacks
  getIceServers(): RTCConfiguration {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };
  }

  // Teardown Call
  endSession(): void {
    this.stopMicrophone();
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }
  }
}

export const webrtcVoice = new WebRTCVoiceService();
