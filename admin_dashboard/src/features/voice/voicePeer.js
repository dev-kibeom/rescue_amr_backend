export class VoicePeer {
  constructor({ onIceCandidate, onRemoteStream, onStateChange, onError }) {
    this.peer = null;
    this.localStream = null;
    this.onIceCandidate = onIceCandidate;
    this.onRemoteStream = onRemoteStream;
    this.onStateChange = onStateChange;
    this.onError = onError;
  }

  async ensurePeer() {
    if (this.peer) {
      return this.peer;
    }

    if (!window.isSecureContext) {
      throw new Error("마이크 사용에는 HTTPS, localhost, 또는 adb reverse가 필요합니다.");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("현재 브라우저에서 마이크 접근을 지원하지 않습니다.");
    }

    if (!window.RTCPeerConnection) {
      throw new Error("현재 브라우저에서 WebRTC를 지원하지 않습니다.");
    }

    this.peer = new RTCPeerConnection({ iceServers: [] });
    this.peer.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(event.candidate.toJSON());
      }
    });
    this.peer.addEventListener("track", (event) => {
      this.onRemoteStream?.(event.streams[0]);
    });
    this.peer.addEventListener("connectionstatechange", () => {
      this.onStateChange?.(this.peer.connectionState);
    });

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    this.localStream.getTracks().forEach((track) => {
      this.peer.addTrack(track, this.localStream);
    });

    return this.peer;
  }

  async createOffer() {
    try {
      const peer = await this.ensurePeer();
      const offer = await peer.createOffer({ offerToReceiveAudio: true });
      await peer.setLocalDescription(offer);
      return peer.localDescription.toJSON();
    } catch (error) {
      this.onError?.(error.message);
      throw error;
    }
  }

  async acceptAnswer(answer) {
    try {
      await this.peer?.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      this.onError?.(error.message);
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    try {
      if (!candidate || !this.peer) {
        return;
      }
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      this.onError?.(error.message);
    }
  }

  close() {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.peer?.close();
    this.peer = null;
  }
}
