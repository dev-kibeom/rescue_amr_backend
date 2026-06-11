// 1. 💡 최상단에 useRef를 추가로 불러옵니다.
import { useEffect, useRef, useState } from "react";
import AresShell from "../components/AresShell";
import ErrorBoundary from "../components/ErrorBoundary";
import PanelHeader from "../components/PanelHeader";
import Ring from "../components/Ring";
import SmoothMarker from "../components/SmoothMarker";
import useClock from "../hooks/useClock";
import useMonitor from "../hooks/useMonitor";
import { navigate } from "../router/aresRouting";

const WEBRTC_PORT = (idx) => 8002 + idx;
// 💡 주소는 로컬 다이렉트 바인딩으로 유지합니다.
const WEBRTC_BASE = (idx) => `http://localhost:8002`;
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80",   username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
];

function waitForIceGathering(pc, timeoutMs = 1800) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(tid);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => { if (pc.iceGatheringState === "complete") done(); };
    pc.addEventListener("icegatheringstatechange", onChange);
    const tid = setTimeout(done, timeoutMs);
  });
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 2. 💡 CameraPanel 컴포넌트 내부 완전 교체
function CameraPanel({ title, tone, robotId, robotIndex, cameraTime, onTelemetry, shouldConnect }) {
  const [connState, setConnState] = useState("idle");
  const [videoEl, setVideoEl] = useState(null);

  // 💡 [핵심 픽스 1]: 1초마다 바뀌는 함수를 ref로 캐싱하여 재렌더링 폭주를 막습니다.
  const onTelemetryRef = useRef(onTelemetry);
  useEffect(() => {
    onTelemetryRef.current = onTelemetry;
  }, [onTelemetry]);

  useEffect(() => {
    if (!shouldConnect) {
      setConnState("idle");
      return;
    }

    let active = true;
    let peerConn = null;

    async function connect() {
      if (peerConn) return;
      setConnState("connecting");

      try {
        peerConn = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        if (!active) { peerConn.close(); return; }

        const dataChannel = peerConn.createDataChannel("telemetry");
        dataChannel.onmessage = (event) => {
          if (!active) return;
          const data = JSON.parse(event.data);
          // 💡 캐싱된 ref를 통해 함수 호출
          if (onTelemetryRef.current) onTelemetryRef.current(robotId, data);
        };

        peerConn.ontrack = (e) => {
          const stream = e.streams[0];
          if (videoEl && stream && active) {
            videoEl.srcObject = stream;
            void videoEl.play().catch(() => {});
            setConnState("connected");
          }
        };

        peerConn.onconnectionstatechange = () => {
          if (!active) return;
          const s = peerConn.connectionState;
          if (s === "failed" || s === "disconnected" || s === "closed") {
            setConnState("error");
          }
        };

        peerConn.addTransceiver("video", { direction: "recvonly" });

        const offer = await peerConn.createOffer();
        await peerConn.setLocalDescription(offer);
        
        await waitForIceGathering(peerConn);
        if (!active) { peerConn.close(); return; }

        let res;
        try {
          res = await fetch(`${WEBRTC_BASE(robotIndex)}/offer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
          });
        } catch (fetchErr) {
          console.error("🚨 [WebRTC] Fetch 네트워크 연결 실패:", fetchErr);
          if (active) setConnState("error");
          if (peerConn) { peerConn.close(); peerConn = null; }
          return;
        }

        if (!res.ok) {
          const errText = await res.text();
          console.error("🚨 [WebRTC] 서버 거부 코드:", res.status, errText);
          throw new Error(`시그널링 실패: ${res.status}`);
        }

        const answer = await res.json();
        await peerConn.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        if (active) { setConnState("error"); }
        if (peerConn) { peerConn.close(); peerConn = null; }
      }
    }

    if (videoEl) connect();

    return () => {
      active = false;
      if (peerConn) { peerConn.close(); peerConn = null; }
    };
  // 💡 [핵심 픽스 2]: 의존성 배열에서 onTelemetry를 제거하여 1초마다 철거되는 비극 차단!
  }, [robotId, robotIndex, videoEl, shouldConnect]);

  useEffect(() => {
    if (connState !== "error" || !shouldConnect) return;
    const timer = setTimeout(() => { setVideoEl(el => el); }, 8000);
    return () => clearTimeout(timer);
  }, [connState, shouldConnect]);

  const stateLabel = {
    idle: "로봇 오프라인 대기 중",
    connecting: "WebRTC 핸드셰이크 중…",
    connected: null,
    error: "로봇 스트리밍 서버 연결 실패 (재시도 중)",
  }[connState];

  return (
    <div className="cam-feed" style={{ width: "100%", height: "100%", position: "relative" }}>
      <video
        ref={setVideoEl}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", display: connState === "connected" ? "block" : "none" }}
      />
      {connState !== "connected" && (
        <div className="cam-overlay">
          <div className="cam-static" />
          <div className="cam-no-signal">
            <span className="big">{connState === "error" ? "⚠️" : "📷"}</span>
            {stateLabel}
            <br />{robotId}
          </div>
        </div>
      )}
      <div className="cam-scanline" />
      <div className={`cam-rec ${tone === "orange" ? "orange-rec" : ""}`}>
        <span className="rec-dot" />
        {connState === "connected" ? "녹화중" : "대기"}
      </div>
      <div className="cam-timestamp">{cameraTime}</div>
    </div>
  );
}

export default function MonitorPage() {
  const cameraTime = useClock({ hour12: false });
  const {
    robots,
    liveTelemetry,
    setLiveTelemetry,
    cameraCoverage,
    setCameraCoverage,
    survivorStats,
    connStatus
  } = useMonitor();

  const getElapsed = () => {
    const t = sessionStorage.getItem("ares_login_time");
    return t ? Math.floor((Date.now() - Number(t)) / 1000) : 0;
  };

  const [missionSeconds, setMissionSeconds] = useState(getElapsed);

  useEffect(() => {
    const id = setInterval(() => setMissionSeconds(getElapsed()), 1000);
    return () => clearInterval(id);
  }, []);

  const MAP_RANGE = 20;
  const toMapPct = (v) => v != null ? Math.min(95, Math.max(5, (v / MAP_RANGE) * 100)) : null;

  const robotColor = (status) => ({
    IDLE: "var(--blue)",
    MOVING: "var(--green)",
    SUCCESS: "var(--green)",
    ERROR: "var(--red-light)",
  }[status] ?? "var(--blue)");

  return (
    <AresShell route="monitor" title="로봇 실시간 모니터링" subtitle="ROBOT LIVE MONITORING">
      <main className="grid-monitor">
        
        <section className="cell gui-cell">
          <PanelHeader
            title="로봇 모니터링"
            tone="green"
            action={<span className="alert-chip tiny"><span className="dot" />실시간</span>}
          />
          <div className="gui-inner">
            <div className="dash">
              <div className="dash-center">
                <div className="sub-header split">
                  <span><span className="dot green" />지도</span>
                  {connStatus.backend === 'error' && <span style={{ color: 'var(--red-light)', fontSize: '0.75rem' }}>⚠ 서버 오프라인</span>}
                  {connStatus.db === 'empty' && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⚠ 로봇 미연결</span>}
                </div>
                <div className="map-area">
                  <img 
                    src={`http://localhost:8001/static/maps/robot5_map.png?t=${Date.now()}`}
                    alt="ARES SLAM MAP"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="map-svg-bg" style={{ position: "absolute", inset: 0, zIndex: 0 }} />
                  
                  {Object.keys(cameraCoverage).map((id) => {
                    const points = cameraCoverage[id] || [];
                    return points.map((p, idx) => {
                      const pctX = toMapPct(p.x);
                      const pctY = toMapPct(p.y);
                      if (pctX === null || pctY === null) return null;
                      return (
                        <div
                          key={`${id}-cov-${idx}`}
                          style={{
                            position: "absolute",
                            left: `${pctX}%`,
                            top: `${pctY}%`,
                            width: "12px",
                            height: "12px",
                            transform: "translate(-50%, -50%)",
                            background: "rgba(46, 204, 113, 0.15)",
                            borderRadius: "50%",
                            pointerEvents: "none",
                            zIndex: 3,
                          }}
                        />
                      );
                    });
                  })}

                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }} viewBox="0 0 100 100">
                    {Object.keys(cameraCoverage).map((id) => {
                      const points = cameraCoverage[id] || [];
                      if (points.length < 2) return null;
                      const coveragePointsStr = points.map(p => `${toMapPct(p.x)},${toMapPct(p.y)}`).join(" ");
                      return (
                        <polygon
                          key={`${id}-coverage`}
                          points={coveragePointsStr}
                          fill="rgba(46, 204, 113, 0.15)"
                          stroke="rgba(46, 204, 113, 0.5)"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </svg>

                  {robots.length === 0 && connStatus.backend === 'ok' && (
                    <div className="cam-no-signal" style={{ position: "absolute", inset: 0, background: "transparent", fontSize: "0.8rem" }}>
                      로봇 데이터 없음
                    </div>
                  )}

                  {Array.isArray(robots) && robots.map((robot, i) => {
                    const currentX = liveTelemetry[robot.id]?.pos_x ?? robot.pos_x;
                    const currentY = liveTelemetry[robot.id]?.pos_y ?? robot.pos_y;
                    const x = toMapPct(currentX);
                    const y = toMapPct(currentY);
                    if (x === null || y === null || isNaN(x) || isNaN(y)) return null;
                    
                    return (
                      <SmoothMarker
                        key={robot.id}
                        targetX={x}
                        targetY={y}
                        isOrange={i > 0}
                        title={`${robot.id} — ${robot.status}`}
                      />
                    );
                  })}

                  <div className="map-overlay-top">
                    <div className="overlay-title">임무 경과시간</div>
                    <div className="overlay-val">{formatDuration(missionSeconds)}</div>
                  </div>
                  <div className="map-legend">
                    <Legend color="var(--blue)" text="로봇(IDLE)" />
                    <Legend color="var(--green)" text="로봇(이동중)" />
                    <Legend color="var(--red-light)" text="로봇(오류)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cell status-cell">
          <PanelHeader title="구조대상자 식별 현황" tone="green" />
          <div className="status-dashboard">
            <div className="casualty-grid-lg">
              <div className="casualty-box-lg survivor">
                <div className="casualty-num-lg">{survivorStats.confirmed}</div>
                <div className="casualty-label-lg">식별 완료</div>
              </div>
              <div className="casualty-box-lg unknown">
                <div className="casualty-num-lg">{survivorStats.unknown}</div>
                <div className="casualty-label-lg">미식별</div>
              </div>
            </div>

            {connStatus.backend === 'error' ? (
              <StatusBadge icon="ti-server-off" color="var(--red-light)" msg="Flask 서버 응답 없음 — Docker 확인" />
            ) : connStatus.db === 'error' ? (
              <StatusBadge icon="ti-database-off" color="var(--red-light)" msg="DB 쿼리 오류 — 테이블 설정을 확인하세요" />
            ) : connStatus.db === 'empty' ? (
              <StatusBadge icon="ti-robot-off" color="#f59e0b" msg="로봇 데이터 없음 — bridge 확인" />
            ) : (
              <>
                <div className="status-line">
                  <span className="status-label">활성 로봇</span>
                  <span className="status-value">{robots.filter(r => r.status !== "ERROR").length} / {robots.length}</span>
                </div>
                <div className="status-line">
                  <span className="status-label">갱신</span>
                  <span className="status-value">실시간</span>
                </div>
              </>
            )}

            <hr className="divider" />
            <div className="ring-row" style={{ justifyContent: "center" }}>
              <Ring
                percent={(() => {
                  const withData = robots.filter(r => r.explored_area != null && r.total_area > 0);
                  if (withData.length === 0) return null;
                  const explored = withData.reduce((s, r) => s + r.explored_area, 0);
                  const total    = withData.reduce((s, r) => s + r.total_area, 0);
                  return Math.min(100, Math.round((explored / total) * 100));
                })()}
                tone="rescue" label="탐사" sub="탐사 완료율" size={76}
              />
            </div>
            <hr className="divider" />

            <div className="prog-label">로봇 상태</div>
            {robots.length === 0 ? (
              <div className="empty" style={{ fontSize: "0.8rem", padding: "0.5rem 0" }}>
                {connStatus.backend === 'error' ? "서버 오프라인" : "로봇 미연결"}
              </div>
            ) : (
              robots.map((robot) => {
                const currentBattery = liveTelemetry[robot.id]?.battery ?? robot.battery ?? null;
                return (
                  <RobotStatus
                    key={robot.id} name={robot.id} status={robot.status}
                    battery={currentBattery} color={robotColor(robot.status)}
                  />
                );
              })
            )}

            <button className="report-link wide" type="button" onClick={() => navigate("report")}>
              <i className="ti ti-file-report" /> 사고 보고서
            </button>
          </div>
        </section>

        {[0, 1].map((idx) => {
          const robot = robots[idx];
          const robotId = robot ? robot.id : `ROBOT-0${idx + 1}`;
          const isRealRobot = !!robot;
          const canConnect = isRealRobot && robot.status !== "ERROR" && connStatus.db === "ok";
          const toneColor = idx === 0 ? "green" : "orange";

          // 💡 [근본적 포트 싱크 매칭]: 문자열이나 순서에 구애받지 않고 실제 기동중인 robot5(포트 8002)로 다이렉트 픽스
          const targetPortIndex = robotId.includes("robot5") ? 0 : idx;

          return (
            <section className="cell cam-cell" key={robotId}>
              <PanelHeader title={`카메라 · ${robotId}`} tone={toneColor} />
              <ErrorBoundary>
                <CameraPanel
                  title={`카메라 · ${robotId}`}
                  tone={toneColor}
                  robotId={robotId}
                  robotIndex={targetPortIndex} 
                  cameraTime={cameraTime}
                  shouldConnect={canConnect}
                  onTelemetry={(id, data) => {
                    if (data.type === "battery") {
                      setLiveTelemetry(id, data);
                    } else if (data.type === "camera_coverage") {
                      setCameraCoverage(id, data.points);
                      setLiveTelemetry(id, data); 
                    }
                  }}
                />
              </ErrorBoundary>
            </section>
          );
        })}
      </main>
    </AresShell>
  );
}

function StatusBadge({ icon, color, msg }) {
  return (
    <div style={{ color, fontSize: "0.8rem", padding: "0.35rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <i className={`ti ${icon}`} style={{ flexShrink: 0 }} />
      <span>{msg}</span>
    </div>
  );
}

function Legend({ color, text }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />{text}
    </div>
  );
}

function RobotStatus({ name, status, battery, color }) {
  const statusLabel = { IDLE: "대기", MOVING: "이동중", SUCCESS: "완료", ERROR: "오류" }[status] ?? status;
  return (
    <div className="robot-status-item">
      <span className="robot-dot" style={{ background: color }} />
      <span className="robot-name">{name}</span>
      <span className="robot-pct" style={{ color }}>
        {battery != null ? `${battery}%` : statusLabel}
      </span>
    </div>
  );
}