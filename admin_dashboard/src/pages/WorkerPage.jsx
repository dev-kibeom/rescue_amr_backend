import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AresShell from "../AresShell";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const emojis = ["👨‍🚒", "👩‍🚒", "🧑‍🚒", "🚒", "🔥"];

function WorkerAvatar({ worker, large = false }) {
  const emoji = worker.sex === "female" ? "👩" : "🧑";
  return <div className={large ? "profile-photo-placeholder" : "avatar-placeholder"}>{emoji}</div>;
}

export default function WorkerPage() {
  const [survivors, setSurvivors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");

  // 인원관리 창 진입 시마다 Supabase에서 데이터 다운로드
  useEffect(() => {
    async function fetchSurvivors() {
      setLoading(true);
      setError(null);
      try {
        if (!supabase) throw new Error("Supabase 설정이 없습니다. .env를 확인하세요.");
        const { data, error } = await supabase
          .from("survivors")
          .select("id, name, sex, phone_number");
        if (error) throw error;
        setSurvivors(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSurvivors();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return survivors.filter((s) => {
      const text = `${s.name} ${s.phone_number ?? ""}`.toLowerCase();
      return !q || text.includes(q);
    });
  }, [query, survivors]);

  const selected = survivors.find((s) => s.id === selectedId) || filtered[0];
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <AresShell route="worker" title="구조대상자 신원 관리" subtitle="SURVIVOR IDENTITY MANAGEMENT">
      <main className="content">

        <section className="today-banner">
          <div className="banner-left">
            <h3>REGISTERED SURVIVORS · {today}</h3>
            <div className="workers">
              {survivors.slice(0, 5).map((s) => (
                <span className="worker-chip" key={s.id}><span className="dot" />{s.name}</span>
              ))}
            </div>
          </div>
          <div className="banner-stats">
            <div className="bstat"><div className="val">{survivors.length}</div><div className="lbl">전체 등록</div></div>
          </div>
        </section>

        <section className="main-grid">
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="ti ti-id-badge-2" /> 구조대상자 목록</span>
            </div>

            <div className="filter-bar">
              <label className="search-wrap">
                <i className="ti ti-search" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 전화번호 검색..." />
              </label>
            </div>

            {loading && <div style={{ padding: "1rem", color: "var(--gray)" }}>불러오는 중...</div>}
            {error && <div style={{ padding: "1rem", color: "var(--red-light)" }}>⚠ {error}</div>}

            {!loading && !error && (
              <table>
                <thead>
                  <tr><th>NAME</th><th>SEX</th><th>PHONE</th></tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className={selected?.id === s.id ? "selected" : ""} onClick={() => setSelectedId(s.id)}>
                      <td><div className="name-cell"><WorkerAvatar worker={s} /><span className="name-text">{s.name}</span></div></td>
                      <td>{s.sex ?? "-"}</td>
                      <td className="mono-cell">{s.phone_number ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <aside className="detail-panel">
            {selected
              ? <SurvivorProfile survivor={selected} />
              : <div className="placeholder-panel"><div className="ph-icon">👆</div><p>구조대상자를 선택하세요</p></div>
            }
          </aside>
        </section>
      </main>
    </AresShell>
  );
}

function SurvivorProfile({ survivor }) {
  return (
    <div className="profile-card">
      <div className="profile-top">
        <div className="profile-photo-wrap">
          <div className="profile-photo-placeholder">{survivor.sex === "female" ? "👩" : "🧑"}</div>
        </div>
        <div className="profile-name">{survivor.name}</div>
        <div className="profile-role">SURVIVOR · ID {survivor.id}</div>
      </div>
      <div className="profile-body">
        <Info label="성별" value={survivor.sex ?? "-"} />
        <Info label="전화번호" value={survivor.phone_number ?? "-"} mono />
      </div>
    </div>
  );
}

function Info({ label, value, mono }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${mono ? "mono-cell" : ""}`}>{value}</span>
    </div>
  );
}
