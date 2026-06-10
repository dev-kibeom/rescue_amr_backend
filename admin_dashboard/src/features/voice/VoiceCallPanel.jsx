import { useEffect, useMemo, useRef, useState } from "react";
import { defaultVoiceWsBase, SignalingClient, SignalType } from "./signalingClient";
import { VoicePeer } from "./voicePeer";

const CONTROL_CLIENT_ID = "admin-control";
const CONTROL_DEVICE_ID = "control-dashboard";

function voiceUrl(base) {
  const cleanBase = base.replace(/\/$/, "");
  return `${cleanBase}/ws/${encodeURIComponent(CONTROL_CLIENT_ID)}?role=control&device_id=${encodeURIComponent(CONTROL_DEVICE_ID)}`;
}

function callStateLabel(state) {
  return {
    idle: "대기",
    ready: "준비",
    calling: "호출 중",
    connected: "통화 중",
    ended: "종료",
    error: "오류",
  }[state] ?? state;
}

export default function VoiceCallPanel() {
  const [serverBase, setServerBase] = useState(defaultVoiceWsBase);
  const [serverState, setServerState] = useState("offline");
  const [callState, setCallState] = useState("idle");
  const [sessionId, setSessionId] = useState("");
  const [androidDevice, setAndroidDevice] = useState("미연결");
  const [micState, setMicState] = useState("대기");
  const [speakerState, setSpeakerState] = useState("대기");
  const [log, setLog] = useState([]);
  const clientRef = useRef(null);
  const voicePeerRef = useRef(null);
  const sessionIdRef = useRef("");
  const remoteAudioRef = useRef(null);

  const connected = serverState === "online";
  const canStart = connected && sessionId && callState !== "connected" && callState !== "calling";
  const compactSessionId = useMemo(() => (
    sessionId ? `${sessionId.slice(0, 8)}...` : "없음"
  ), [sessionId]);

  const addLog = (message, level = "info") => {
    setLog((prev) => [
      { id: `${Date.now()}-${Math.random()}`, message, level },
      ...prev,
    ].slice(0, 5));
  };

  const send = (type, payload) => {
    return clientRef.current?.send({
      type,
      session_id: sessionIdRef.current || null,
      payload: payload ?? {},
    });
  };

  const closeVoicePeer = () => {
    voicePeerRef.current?.close();
    voicePeerRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  const ensureVoicePeer = () => {
    if (voicePeerRef.current) {
      return voicePeerRef.current;
    }

    voicePeerRef.current = new VoicePeer({
      onIceCandidate: (candidate) => {
        send(SignalType.ICE_CANDIDATE, { candidate });
      },
      onRemoteStream: (stream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          void remoteAudioRef.current.play().catch(() => {});
        }
        setSpeakerState("수신");
      },
      onStateChange: (connectionState) => {
        addLog(`WebRTC ${connectionState}`);
        if (connectionState === "connected") {
          setCallState("connected");
          setMicState("활성");
          setSpeakerState("활성");
        }
        if (["failed", "closed", "disconnected"].includes(connectionState)) {
          setCallState(connectionState === "closed" ? "ended" : "error");
          setSpeakerState("대기");
        }
      },
      onError: (message) => addLog(message, "error"),
    });

    return voicePeerRef.current;
  };

  const handleStatus = (payload = {}) => {
    const clients = Object.values(payload.clients ?? {});
    const sessions = Object.values(payload.sessions ?? {});
    const android = clients.find((client) => client.role === "android");
    const activeSession = sessions.find((session) => (
      session.control_client_id === CONTROL_CLIENT_ID
      || session.android_client_id === android?.client_id
    )) ?? sessions[0];

    setAndroidDevice(android?.device_id ?? "미연결");

    if (activeSession) {
      sessionIdRef.current = activeSession.session_id;
      setSessionId(activeSession.session_id);
      setCallState(activeSession.state ?? "idle");
    }
  };

  const handleMessage = (message) => {
    if (message.session_id) {
      sessionIdRef.current = message.session_id;
      setSessionId(message.session_id);
    }

    if (message.type === SignalType.STATUS) {
      handleStatus(message.payload);
      return;
    }

    if (message.type === SignalType.ANSWER) {
      void voicePeerRef.current?.acceptAnswer(message.payload);
      setCallState("connected");
      setMicState("활성");
      setSpeakerState("활성");
      addLog("Android 응답 수신", "ok");
      return;
    }

    if (message.type === SignalType.ICE_CANDIDATE) {
      void voicePeerRef.current?.addIceCandidate(message.payload?.candidate);
      return;
    }

    if (message.type === SignalType.ERROR) {
      setCallState("error");
      addLog(message.payload?.detail ?? "음성 signaling 오류", "error");
    }
  };

  const connect = () => {
    clientRef.current?.disconnect();
    closeVoicePeer();
    setCallState("idle");
    setMicState("대기");
    setSpeakerState("대기");

    const client = new SignalingClient({
      url: voiceUrl(serverBase),
      onOpen: () => {
        setServerState("online");
        addLog("음성 서버 연결", "ok");
      },
      onClose: () => {
        setServerState("offline");
        setCallState("idle");
        setMicState("대기");
        setSpeakerState("대기");
        addLog("음성 서버 연결 해제");
      },
      onMessage: handleMessage,
      onError: (message) => {
        setServerState((prev) => (prev === "online" ? prev : "error"));
        addLog(message, "error");
      },
    });

    clientRef.current = client;
    client.connect();
  };

  const disconnect = () => {
    send(SignalType.CALL_END);
    clientRef.current?.disconnect();
    clientRef.current = null;
    closeVoicePeer();
    sessionIdRef.current = "";
    setSessionId("");
    setServerState("offline");
    setCallState("idle");
    setMicState("대기");
    setSpeakerState("대기");
  };

  const createSession = () => {
    if (!connected) {
      addLog("먼저 음성 서버에 연결하세요.", "error");
      return;
    }
    send(SignalType.SESSION_CREATE);
  };

  const startCall = async () => {
    if (!sessionIdRef.current) {
      addLog("세션 생성 후 통화를 시작하세요.", "error");
      return;
    }

    try {
      setCallState("calling");
      setMicState("권한 확인");
      const offer = await ensureVoicePeer().createOffer();
      setMicState("송신");
      send(SignalType.OFFER, offer);
    } catch (error) {
      setCallState("error");
      setMicState("차단");
      addLog(`통화 시작 실패: ${error.message}`, "error");
    }
  };

  const endCall = () => {
    send(SignalType.CALL_END);
    closeVoicePeer();
    setCallState("ended");
    setMicState("대기");
    setSpeakerState("대기");
  };

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
      closeVoicePeer();
    };
  }, []);

  return (
    <section className="voice-panel">
      <div className="voice-panel-head">
        <span className="voice-title">
          <i className="ti ti-microphone" />
          음성 통신
        </span>
        <span className={`voice-pill ${serverState}`}>
          {serverState === "online" ? "ONLINE" : serverState === "error" ? "ERROR" : "OFFLINE"}
        </span>
      </div>

      <label className="voice-server-field">
        <span>VOICE SERVER</span>
        <input
          value={serverBase}
          onChange={(event) => setServerBase(event.target.value)}
          disabled={connected}
        />
      </label>

      <div className="voice-status-grid">
        <div>
          <span>Android</span>
          <strong>{androidDevice}</strong>
        </div>
        <div>
          <span>Session</span>
          <strong>{compactSessionId}</strong>
        </div>
        <div>
          <span>Mic</span>
          <strong>{micState}</strong>
        </div>
        <div>
          <span>Speaker</span>
          <strong>{speakerState}</strong>
        </div>
      </div>

      <div className="voice-call-state">
        <span className={`voice-call-dot ${callState}`} />
        {callStateLabel(callState)}
      </div>

      <div className="voice-actions">
        {connected ? (
          <button type="button" className="voice-btn ghost" onClick={disconnect}>
            <i className="ti ti-plug-off" />
            해제
          </button>
        ) : (
          <button type="button" className="voice-btn" onClick={connect}>
            <i className="ti ti-plug-connected" />
            연결
          </button>
        )}
        <button type="button" className="voice-btn ghost" onClick={createSession} disabled={!connected}>
          <i className="ti ti-link-plus" />
          세션
        </button>
        <button type="button" className="voice-btn primary" onClick={startCall} disabled={!canStart}>
          <i className="ti ti-phone-calling" />
          통화
        </button>
        <button type="button" className="voice-btn danger" onClick={endCall} disabled={!connected}>
          <i className="ti ti-phone-off" />
          종료
        </button>
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="voice-log">
        {log.length === 0 ? (
          <span>이벤트 없음</span>
        ) : log.map((item) => (
          <span key={item.id} className={item.level}>{item.message}</span>
        ))}
      </div>
    </section>
  );
}
