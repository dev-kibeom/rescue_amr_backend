import { useCallback, useEffect, useState } from "react";
import AresShell from "../components/AresShell";
import { logger } from "../utils/logger";

const API_BASE = "http://localhost:8001/api";
const POLL_INTERVAL = 5000;

async function fetchAllLogs() {
  const [incidentRes, survivorRes] = await Promise.all([
    fetch(`${API_BASE}/logs`),
    fetch(`${API_BASE}/survivor-logs?limit=50`),
  ]);

  const incidents = incidentRes.ok ? await incidentRes.json() : [];
  const survivors = survivorRes.ok ? await survivorRes.json() : [];

  const survivorFormatted = survivors.map((s) => {
    let msg = s.survivor_name 
      ? `[생존자 식별] ${s.survivor_name} 님 감지 (유사도: ${s.similarity ?? "-"}%) — ${s.robot_id}`
      : `[미식별 대상] 좌표 (${s.detected_x?.toFixed(1)}, ${s.detected_y?.toFixed(1)}) — ${s.robot_id}`;
    return { time: s.time, msg, _key: `sv-${s.log_number}` };
  });

  const incidentFormatted = incidents.map((i) => ({
    time: i.time,
    msg: i.msg,
    _key: `inc-${i.time}-${i.msg}`,
  }));

  return [...incidentFormatted, ...survivorFormatted].sort((a, b) => b.time.localeCompare(a.time));
}

function LogMessage({ msg }) {
  return <span dangerouslySetInnerHTML={{ __html: msg }} />;
}

export default function ReportPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllLogs();
      setLogs(data);
      setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour12: false }));
      setError(null);
    } catch (e) {
      logger.warn("구조 현황 보고서 로그 수집 실패:", e.message);
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [load]);

  return (
    <AresShell route="report" title="실시간 구조활동 기록">
      <main className="content">
        <section className="report-summary report-summary-2">
          <div className="stat">
            <i className="ti ti-list-details" />
            <div>
              <div className="stat-val">{loading ? "…" : logs.length}</div>
              <div className="stat-label">전체 기록</div>
            </div>
          </div>
          <div className="stat">
            <i className="ti ti-clock-check" />
            <div>
              <div className="stat-val">{lastUpdated ?? "-"}</div>
              <div className="stat-label">마지막 갱신</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <i className="ti ti-file-analytics" />구조활동 내용
            </span>
            <button className="btn" type="button" onClick={load} disabled={loading}>
              <i className="ti ti-refresh" /> {loading ? "로딩 중…" : "새로고침"}
            </button>
          </div>

          {error && (
            <div className="empty" style={{ color: "var(--red-light)", padding: "1.5rem" }}>
              <i className="ti ti-wifi-off" /> {error}
            </div>
          )}

          <div className="log-list">
            {!error && !loading && logs.length === 0 && (
              <div className="empty">기록된 활동이 없습니다.</div>
            )}
            {logs.map((log) => (
              <div className="log-item" key={log._key}>
                <span className="log-time">{log.time}</span>
                <span className="log-msg">
                  <LogMessage msg={log.msg} />
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AresShell>
  );
}