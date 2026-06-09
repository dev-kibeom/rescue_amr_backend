import { useEffect, useState } from "react";
import AresShell from "../AresShell";
import { navigate } from "../aresRouting";
import useClock from "../useClock";

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Ring({ percent, tone, label, sub, size = 76 }) {
  const radius = size === 76 ? 30 : 22;
  const center = size / 2;
  const circumference = Math.round(2 * Math.PI * radius);
  const fill = (percent / 100) * circumference;

  return (
    <div className="circle-wrap">
      <div className="circle-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle className="ring-bg" cx={center} cy={center} r={radius} />
          <circle className={`ring-fill ${tone}`} cx={center} cy={center} r={radius} strokeDasharray={`${fill} ${circumference - fill}`} />
        </svg>
        <div className="circle-val">
          <span className="circle-num">{percent}%</span>
          <span className="circle-lbl-sm">{label}</span>
        </div>
      </div>
      <div className="ring-label">{sub}</div>
    </div>
  );
}

export default function MonitorPage() {
  const cameraTime = useClock({ hour12: false });
  const [missionSeconds, setMissionSeconds] = useState(34 * 60 + 17);
  const [robots, setRobots] = useState({ r1: { x: 57, y: 66 }, r2: { x: 31, y: 31 } });

  useEffect(() => {
    const timer = window.setInterval(() => setMissionSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRobots((current) => ({
        r1: { x: current.r1.x + (Math.random() - 0.5) * 0.4, y: current.r1.y + (Math.random() - 0.5) * 0.3 },
        r2: { x: current.r2.x + (Math.random() - 0.5) * 0.3, y: current.r2.y + (Math.random() - 0.5) * 0.4 },
      }));
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <AresShell route="monitor" title="로봇 실시간 모니터링" subtitle="ROBOT LIVE MONITORING">
      <main className="grid-monitor">
        <section className="cell gui-cell">
          <PanelHeader title="로봇 모니터링" tone="green" action={<span className="alert-chip tiny"><span className="dot" />실시간</span>} />
          <div className="gui-inner">
            <div className="dash">
              <div className="dash-center">
                <div className="sub-header split"><span><span className="dot green" />지도 · 3층</span></div>
                <div className="map-area">
                  <div className="map-svg-bg" />
                  <svg className="map-floor" viewBox="0 0 500 300" aria-hidden="true">
                    <rect x="30" y="25" width="440" height="250" rx="10" fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
                    <path d="M30 110H470M30 195H470M165 25V275M325 25V275" stroke="#cbd5e1" strokeWidth="2" />
                    <rect x="45" y="42" width="120" height="68" fill="#e3f2fd" opacity=".55" />
                    <rect x="180" y="42" width="130" height="68" fill="#f8fafc" />
                    <rect x="340" y="42" width="110" height="68" fill="#f8fafc" />
                    <rect x="340" y="202" width="110" height="58" fill="#fff1f1" />
                    <path d="M360 218c25-20 58-8 66 22" stroke="#ef5350" strokeWidth="5" fill="none" opacity=".65" />
                  </svg>
                  <div className="robot-marker" style={{ left: `${robots.r1.x}%`, top: `${robots.r1.y}%` }}>🤖</div>
                  <div className="robot-marker orange" style={{ left: `${robots.r2.x}%`, top: `${robots.r2.y}%` }}>🤖</div>
                  <div className="survivor-marker" style={{ left: "77%", top: "60%" }}>👤</div>
                  <div className="survivor-marker" style={{ left: "81%", top: "76%" }}>👤</div>
                  <div className="safe-marker" style={{ left: "27%", top: "26%" }}>✓</div>
                  <div className="safe-marker" style={{ left: "43%", top: "24%" }}>✓</div>
                  <div className="map-overlay-top"><div className="overlay-title">임무 경과시간</div><div className="overlay-val">{formatDuration(missionSeconds)}</div></div>
                  <div className="map-legend">
                    <Legend color="var(--blue)" text="로봇" />
                    <Legend color="var(--red-light)" text="생존자" />
                    <Legend color="var(--green)" text="구조완료" />
                    <Legend color="rgba(192,57,43,0.5)" text="화재" />
                  </div>
                </div>
              </div>

              <aside className="dash-right">
                <div className="sub-header"><span className="dot orange-dot" />생존자 현황</div>
                <div className="sub-body">
                  <div className="casualty-grid">
                    <div className="casualty-box survivor"><div className="casualty-num">7</div><div className="casualty-label">생존확인</div></div>
                    <div className="casualty-box unknown"><div className="casualty-num">9</div><div className="casualty-label">미확인</div></div>
                  </div>
                  <StatusLine label="구역" value="13/20" />
                  <StatusLine label="화재위치" value="306호" />
                  <StatusLine label="갱신" value="실시간" />
                  <button className="report-link" type="button" onClick={() => navigate("report")}><i className="ti ti-file-report" /> 보고서</button>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="cell status-cell">
          <PanelHeader title="구조 · 생존자 현황" tone="green" />
          <div className="status-dashboard">
            <Ring percent={65} tone="rescue" label="구조" sub="구조 진행률" />
            <Ring percent={74} tone="robot" label="배터리" sub="로봇 평균 배터리" />
            <hr className="divider" />
            <div className="prog-label">로봇 상태</div>
            <RobotStatus name="ROBOT-01" percent={82} color="var(--blue)" />
            <RobotStatus name="ROBOT-02" percent={31} color="var(--orange)" />
            <RobotStatus name="ROBOT-03" percent={96} color="var(--green)" />
            <button className="report-link wide" type="button" onClick={() => navigate("report")}><i className="ti ti-file-report" /> 사고 보고서</button>
          </div>
        </section>

        <CameraPanel title="카메라 · ROBOT-01" time={cameraTime} tone="green" />
        <CameraPanel title="카메라 · ROBOT-02" time={cameraTime} tone="orange" />
      </main>
    </AresShell>
  );
}

function PanelHeader({ title, tone, action }) {
  return <div className="panel-header"><span className="panel-title"><span className={`dot ${tone}`} />{title}</span>{action}</div>;
}

function StatusLine({ label, value }) {
  return <div className="status-line"><span className="status-label">{label}</span><span className="status-value">{value}</span></div>;
}

function Legend({ color, text }) {
  return <div className="legend-item"><span className="legend-dot" style={{ background: color }} />{text}</div>;
}

function RobotStatus({ name, percent, color }) {
  return (
    <div className="robot-status-item">
      <span className="robot-dot" style={{ background: color }} />
      <span className="robot-name">{name}</span>
      <span className="robot-pct">{percent}%</span>
    </div>
  );
}

function CameraPanel({ title, time, tone }) {
  return (
    <section className="cell cam-cell">
      <PanelHeader title={title} tone={tone} />
      <div className="cam-feed">
        <div className="cam-overlay">
          <div className="cam-static" />
          <div className="cam-no-signal"><span className="big">📷</span>영상 연결 대기 중<br />{title.replace("카메라 · ", "")}</div>
        </div>
        <div className="cam-scanline" />
        <div className={`cam-rec ${tone === "orange" ? "orange-rec" : ""}`}><span className="rec-dot" />녹화중</div>
        <div className="cam-timestamp">{time}</div>
      </div>
    </section>
  );
}
