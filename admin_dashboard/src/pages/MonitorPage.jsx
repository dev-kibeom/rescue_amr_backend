import { useEffect, useState, useRef, useCallback } from "react";
import AresShell from "../AresShell";
import { navigate } from "../aresRouting";
import useClock from "../useClock";
import { useWebRTCSession } from "../WebRTCSession";

const API_BASE = "http://localhost:8001/api";
const normalizeRobotId = (id) => String(id ?? "").trim().toLowerCase().replace(/-/g, "_");
const POLL_INTERVAL = 3000; // 3초 로봇 상태 폴링
const MAP_LAYER_PRIORITY = {
  map: 0,
  global_costmap: 1,
  local_costmap: 2,
  camera_coverage: 3,
};

function getMapBounds(map) {
  if (!map) return null;
  const origin = map.origin ?? { x: 0, y: 0 };
  const widthMeters = map.width * map.resolution;
  const heightMeters = map.height * map.resolution;
  if (!widthMeters || !heightMeters) return null;
  return {
    left: Number(origin.x ?? 0),
    bottom: Number(origin.y ?? 0),
    width: widthMeters,
    height: heightMeters,
  };
}

function getLayerStyle(layerMap, baseMap) {
  const baseBounds = getMapBounds(baseMap);
  const layerBounds = getMapBounds(layerMap);
  if (!baseBounds || !layerBounds) {
    return { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" };
  }

  return {
    position: "absolute",
    left: `${((layerBounds.left - baseBounds.left) / baseBounds.width) * 100}%`,
    top: `${100 - ((layerBounds.bottom - baseBounds.bottom + layerBounds.height) / baseBounds.height) * 100}%`,
    width: `${(layerBounds.width / baseBounds.width) * 100}%`,
    height: `${(layerBounds.height / baseBounds.height) * 100}%`,
    objectFit: "fill",
    pointerEvents: "none",
  };
}

function mapWorldToPercent(pose, map) {
  if (!pose || !map) return null;
  const origin = map.origin ?? { x: 0, y: 0 };
  const widthMeters = map.width * map.resolution;
  const heightMeters = map.height * map.resolution;
  if (!widthMeters || !heightMeters) return null;

  const left = ((pose.x - origin.x) / widthMeters) * 100;
  const top = 100 - ((pose.y - origin.y) / heightMeters) * 100;
  return {
    left: `${Math.min(98, Math.max(2, left))}%`,
    top: `${Math.min(98, Math.max(2, top))}%`,
  };
}

function markerColor(marker, fallback) {
  const color = marker?.color;
  if (!color) return fallback;
  const r = Math.round((color.r ?? 0) * 255);
  const g = Math.round((color.g ?? 0) * 255);
  const b = Math.round((color.b ?? 0) * 255);
  const a = color.a ?? 0.75;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function getMarkerStyle(marker, map, layer) {
  const position = mapWorldToPercent(marker, map);
  if (!position) return null;

  const widthMeters = map.width * map.resolution;
  const heightMeters = map.height * map.resolution;
  const markerWidth = Math.max(8, ((marker.scale?.x ?? 0.25) / widthMeters) * 100);
  const markerHeight = Math.max(8, ((marker.scale?.y ?? 0.25) / heightMeters) * 100);

  if (layer === "coverage_markers") {
    return {
      position: "absolute",
      left: position.left,
      top: position.top,
      width: `${markerWidth}%`,
      height: `${markerHeight}%`,
      transform: "translate(-50%, -50%)",
      border: "1px solid rgba(6, 182, 212, 0.75)",
      background: markerColor(marker, "rgba(6, 182, 212, 0.14)"),
      pointerEvents: "none",
      zIndex: 12,
    };
  }

  return {
    position: "absolute",
    left: position.left,
    top: position.top,
    width: 14,
    height: 14,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "2px solid #fff",
    background: markerColor(marker, "rgba(239, 68, 68, 0.95)"),
    boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.35)",
    pointerEvents: "none",
    zIndex: 19,
  };
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Ring 차트 (구조율/배터리 평균) ────────────────────────────────────────
function Ring({ percent, tone, label, sub, size = 76 }) {
  const radius = size === 76 ? 30 : 22;
  const center = size / 2;
  const circumference = Math.round(2 * Math.PI * radius);
  const fill = Math.round(((percent ?? 0) / 100) * circumference);
  return (
    <div className="circle-wrap">
      <div className="circle-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle className="ring-bg" cx={center} cy={center} r={radius} />
          <circle
            className={`ring-fill ${tone}`}
            cx={center} cy={center} r={radius}
            strokeDasharray={`${fill} ${circumference - fill}`}
          />
        </svg>
        <div className="circle-val">
          <span className="circle-num">{percent ?? "—"}%</span>
          <span className="circle-lbl-sm">{label}</span>
        </div>
      </div>
      <div className="ring-label">{sub}</div>
    </div>
  );
}

// ─── 카메라 패널 (WebRTC) ────────────────────────────────────────────────────
function CameraPanel({ title, tone, robotId, cameraTime, stream, connState = "idle" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream ?? null;
    if (stream) void videoRef.current.play().catch(() => {});
  }, [stream]);

  const stateLabel = {
    idle: "대기 중",
    connecting: "연결 중…",
    connected: null, // 연결되면 오버레이 숨김
    error: "연결 실패 — 재시도 중…",
  }[connState];

  return (
    <section className="cell cam-cell">
      <PanelHeader title={title} tone={tone} />
      <div className="cam-feed">
        {/* 실제 WebRTC 비디오 */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: connState === "connected" ? "block" : "none" }}
        />
        {/* 연결 전/실패 오버레이 */}
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
    </section>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function MonitorPage() {
  const cameraTime = useClock({ hour12: false });
  const {
    cameraStreams,
    cameraStates,
    streamMap,
    streamLayers,
    streamMarkers,
    streamPose,
    mapStreamState,
  } = useWebRTCSession();
  // 로그인 시각 기준 경과 시간 — sessionStorage에서 읽어 계산
  // 페이지 이동/리마운트와 무관하게 유지됨
  const getElapsed = () => {
    const t = sessionStorage.getItem("ares_login_time");
    return t ? Math.floor((Date.now() - Number(t)) / 1000) : 0;
  };
  const [missionSeconds, setMissionSeconds] = useState(getElapsed);
  const [robots, setRobots] = useState([]);        // rescue_robots 테이블 — 항상 배열
  const [survivorStats, setSurvivorStats] = useState({ confirmed: 0, unknown: 0 });
  // 연결 상태 3단계 분리
  // backend: 'ok' | 'error'   — Flask 서버 자체 응답 여부
  // db:      'ok' | 'empty' | 'error'  — 테이블 데이터 존재 여부
  const [connStatus, setConnStatus] = useState({ backend: 'ok', db: 'ok' });

  // 1초마다 로그인 시각 기준 재계산
  useEffect(() => {
    const id = setInterval(() => setMissionSeconds(getElapsed()), 1000);
    return () => clearInterval(id);
  }, []);

  // 로봇 상태 + 생존자 통계 폴링
  const fetchStatus = useCallback(async () => {
    let robotRes, survivorRes;

    // ── 1단계: Flask 서버 응답 여부 ─────────────────────────────────
    try {
      [robotRes, survivorRes] = await Promise.all([
        fetch(`${API_BASE}/robots`),
        fetch(`${API_BASE}/survivor-logs?limit=200`),
      ]);
    } catch {
      // fetch 자체 실패 = 서버가 꺼져있음
      setConnStatus({ backend: 'error', db: 'ok' });
      return;
    }

    // ── 2단계: 로봇 데이터 파싱 ─────────────────────────────────────
    if (robotRes.ok) {
      const data = await robotRes.json();
      // endpoints.py가 { db_status, robots: [] } 형태로 반환
      const robotList = Array.isArray(data.robots) ? data.robots
                      : Array.isArray(data)        ? data
                      : [];
      setRobots(robotList);
      const dbSt = data.db_status ?? (robotList.length === 0 ? 'empty' : 'ok');
      setConnStatus({ backend: 'ok', db: dbSt });
    } else {
      setConnStatus({ backend: 'ok', db: 'error' });
    }

    // ── 3단계: 생존자 로그 ───────────────────────────────────────────
    if (survivorRes.ok) {
      const logs = await survivorRes.json();
      const confirmed = new Set(logs.filter((l) => l.survivor_id).map((l) => l.survivor_id)).size;
      const unknown = logs.filter((l) => !l.survivor_id).length;
      setSurvivorStats({ confirmed, unknown });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // 로봇 위치를 맵 퍼센트로 변환 (pos_x/y가 미터 단위라 가정, 맵 범위 0~20m)
  const MAP_RANGE = 20;
  const toMapPct = (v) => v != null ? Math.min(95, Math.max(5, (v / MAP_RANGE) * 100)) : null;
  const streamPoseStyle = mapWorldToPercent(streamPose, streamMap);
  const hasLiveMapImage = Boolean(streamMap?.image);
  const mapStateLabel = hasLiveMapImage
    ? "LIVE"
    : mapStreamState === "receiving"
      ? "RX"
      : mapStreamState === "connected"
        ? "RTC"
        : mapStreamState === "connecting"
          ? "CONN"
          : "WAIT";

  // 상태별 색상
  const robotColor = (status) => ({
    IDLE: "var(--blue)",
    MOVING: "var(--green)",
    SUCCESS: "var(--green)",
    ERROR: "var(--red-light)",
  }[status] ?? "var(--blue)");

  return (
    <AresShell route="monitor" title="로봇 실시간 모니터링" subtitle="ROBOT LIVE MONITORING">
      <main className="grid-monitor">

        {/* ── 지도 패널 ─────────────────────────────────────────────────── */}
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
                  {connStatus.backend === 'error' && <span style={{ color: 'var(--red-light)', fontSize: '0.75rem' }}>⚠ 서버 오프라인</span>}{connStatus.db === 'empty' && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⚠ 로봇 미연결</span>}
                </div>
                <div className="map-area">
                  {hasLiveMapImage ? (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#eef2f5" }}>
                      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
                      <img
                        src={streamMap.image}
                        alt=""
                        style={{ ...getLayerStyle(streamMap, streamMap), zIndex: 1 }}
                      />
                      {["global_costmap", "local_costmap", "camera_coverage"].map((layer) => (
                        streamLayers[layer]?.image ? (
                          <img
                            key={layer}
                            src={streamLayers[layer].image}
                            alt=""
                            style={{ ...getLayerStyle(streamLayers[layer], streamMap), zIndex: MAP_LAYER_PRIORITY[layer] + 2 }}
                          />
                        ) : null
                      ))}
                      {["coverage_markers", "survivor_markers"].flatMap((layer) => (
                        (streamMarkers[layer] ?? []).map((marker) => {
                          const style = getMarkerStyle(marker, streamMap, layer);
                          if (!style) return null;
                          return (
                            <div
                              key={`${layer}-${marker.ns}-${marker.id}`}
                              style={style}
                              title={`${layer} ${marker.ns ?? ""} ${marker.id}`}
                            />
                          );
                        })
                      ))}
                      </div>
                    </div>
                  ) : (
                    <div className="map-svg-bg" />
                  )}
                  <div
                    title={`map stream: ${mapStreamState}`}
                    style={{ position: "absolute", top: 6, right: 6, zIndex: 20, fontSize: "0.72rem", color: hasLiveMapImage ? "var(--green)" : "#94a3b8", background: "rgba(255,255,255,0.9)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 7px" }}
                  >
                    MAP {mapStateLabel}
                  </div>
                  {/* DB에서 받은 로봇 마커 */}
                  {robots.length === 0 && connStatus.backend === 'ok' && (
                    <div className="cam-no-signal" style={{ position: "absolute", inset: 0, background: "transparent", fontSize: "0.8rem" }}>
                      로봇 데이터 없음
                    </div>
                  )}
                  {Array.isArray(robots) && robots.map((robot, i) => {
                    const x = toMapPct(robot.pos_x);
                    const y = toMapPct(robot.pos_y);
                    if (x == null || y == null) return null;
                    return (
                      <div
                        key={robot.id}
                        className={`robot-marker ${i > 0 ? "orange" : ""}`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        title={`${robot.id} — ${robot.status}`}
                      >
                        🤖
                      </div>
                    );
                  })}
                  {streamPoseStyle && (
                    <div
                      className="robot-marker"
                      style={{ ...streamPoseStyle, zIndex: 18 }}
                      title={`${streamPose.robotId ?? "robot"} — map stream`}
                    >
                      🤖
                    </div>
                  )}

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

        {/* ── 구조대상자 식별 현황 + 로봇 상태 패널 ──────────────────── */}
        <section className="cell status-cell">
          <PanelHeader title="구조대상자 식별 현황" tone="green" />
          <div className="status-dashboard">

            {/* 생존자 카운트 */}
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
              <StatusBadge icon="ti-server-off" color="var(--red-light)"
                msg="Flask 서버 응답 없음 — Docker 컨테이너를 확인하세요" />
            ) : connStatus.db === 'error' ? (
              <StatusBadge icon="ti-database-off" color="var(--red-light)"
                msg="DB 쿼리 오류 — rescue_robots 테이블을 확인하세요" />
            ) : connStatus.db === 'empty' ? (
              <StatusBadge icon="ti-robot-off" color="#f59e0b"
                msg="로봇 데이터 없음 — bt_db_bridge 실행 여부 확인" />
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

            {/* Ring 차트 — 탐사 완료율 단일 */}
            <div className="ring-row" style={{ justifyContent: "center" }}>
              <Ring
                percent={(() => {
                  // 모든 로봇의 explored_area / total_area 합산
                  const withData = robots.filter(r => r.explored_area != null && r.total_area > 0);
                  if (withData.length === 0) return null;
                  const explored = withData.reduce((s, r) => s + r.explored_area, 0);
                  const total    = withData.reduce((s, r) => s + r.total_area, 0);
                  return Math.min(100, Math.round((explored / total) * 100));
                })()}
                tone="rescue"
                label="탐사"
                sub="탐사 완료율"
                size={76}
              />
            </div>

            <hr className="divider" />

            <div className="prog-label">로봇 상태</div>
            {robots.length === 0 ? (
              <div className="empty" style={{ fontSize: "0.8rem", padding: "0.5rem 0" }}>
                {connStatus.backend === 'error' ? "서버 오프라인" : "로봇 미연결"}
              </div>
            ) : (
              robots.map((robot) => (
                <RobotStatus
                  key={robot.id}
                  name={robot.id}
                  status={robot.status}
                  battery={robot.battery ?? null}
                  color={robotColor(robot.status)}
                />
              ))
            )}

            <button className="report-link wide" type="button" onClick={() => navigate("report")}>
              <i className="ti ti-file-report" /> 사고 보고서
            </button>
          </div>
        </section>

        {/* ── 카메라 패널 (WebRTC) ──────────────────────────────────────── */}
        {/* 로봇이 있으면 첫 두 대, 없으면 기본 2개 슬롯 */}
        {(Array.isArray(robots) && robots.length > 0 ? robots.slice(0, 2) : [{ id: "robot1" }, { id: "robot5" }]).map((robot, i) => (
          <CameraPanel
            key={robot.id}
            title={`카메라 · ${robot.id}`}
            tone={i === 0 ? "green" : "orange"}
            robotId={robot.id}
            cameraTime={cameraTime}
            stream={cameraStreams[normalizeRobotId(robot.id)]}
            connState={cameraStates[normalizeRobotId(robot.id)] ?? "idle"}
          />
        ))}
      </main>
    </AresShell>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────
function StatusBadge({ icon, color, msg }) {
  return (
    <div style={{ color, fontSize: "0.8rem", padding: "0.35rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <i className={`ti ${icon}`} style={{ flexShrink: 0 }} />
      <span>{msg}</span>
    </div>
  );
}

function PanelHeader({ title, tone, action }) {
  return (
    <div className="panel-header">
      <span className="panel-title"><span className={`dot ${tone}`} />{title}</span>
      {action}
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
