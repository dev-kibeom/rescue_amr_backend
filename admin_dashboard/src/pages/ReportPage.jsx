import { useState } from "react";
import AresShell from "../AresShell";

const defaultLogs = [
  { time: "14:28:03", msg: "ROBOT-01 306호 진입 - 생존자 2명 감지", highlight: "ROBOT-01" },
  { time: "14:25:47", msg: "306호 화재 진압 진행 중" },
  { time: "14:22:11", msg: "ROBOT-02 배터리 경고 (31%)", highlight: "ROBOT-02" },
  { time: "14:18:34", msg: "305호 탐색 완료 - 이상 없음" },
  { time: "14:15:09", msg: "생존자 304호에서 구조 완료", highlight: "생존자" },
  { time: "14:12:55", msg: "ROBOT-01 303호 진입 완료" },
  { time: "14:08:22", msg: "301호, 302호 탐색 완료" },
  { time: "14:03:40", msg: "미션 시작 · 3층 진입" },
];

function HighlightedMessage({ log }) {
  if (!log.highlight || !log.msg.includes(log.highlight)) return <span>{log.msg}</span>;
  const [before, after] = log.msg.split(log.highlight);
  return <span>{before}<span className="highlight">{log.highlight}</span>{after}</span>;
}

export default function ReportPage() {
  const [logs, setLogs] = useState(defaultLogs);

  return (
    <AresShell route="report" title="실시간 구조활동 기록">
      <main className="content">
        <section className="report-summary report-summary-2">
          <ReportStat icon="ti-list-details" value={logs.length} label="전체 기록" />
          <ReportStat icon="ti-clock-check" value={logs[0]?.time || "-"} label="최근 기록 시각" />
        </section>

        <section className="panel">
          <div className="panel-header">
            <span className="panel-title"><i className="ti ti-file-analytics" />구조활동 내용</span>
            <button className="btn" type="button" onClick={() => setLogs([...defaultLogs])}><i className="ti ti-refresh" /> 새로고침</button>
          </div>
          <div className="log-list">
            {logs.length ? logs.map((log) => (
              <div className="log-item" key={`${log.time}-${log.msg}`}>
                <span className="log-time">{log.time}</span>
                <span className="log-msg"><HighlightedMessage log={log} /></span>
              </div>
            )) : <div className="empty">기록된 활동이 없습니다.</div>}
          </div>
        </section>
      </main>
    </AresShell>
  );
}

function ReportStat({ icon, value, label }) {
  return (
    <div className="stat">
      <i className={`ti ${icon}`} />
      <div>
        <div className="stat-val">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
