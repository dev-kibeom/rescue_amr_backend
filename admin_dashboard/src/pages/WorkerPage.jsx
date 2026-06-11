import { useEffect, useState } from "react";
import AresShell from "../components/AresShell";
import useSurvivors from "../hooks/useSurvivors";

function maskId(id) {
  if (!id) return "-";
  const cleanId = id.replace("-", "");
  if (cleanId.length >= 7) {
    return `${cleanId.slice(0, 6)} - ${cleanId[6]}******`;
  }
  return id;
}

function ProfilePhoto({ survivor }) {
  const [imgError, setImgError] = useState(false);
  const emoji = survivor.sex === "여" ? "👩" : "🧑";

  if (survivor.face && !imgError) {
    return (
      <img
        src={survivor.face}
        alt={survivor.name}
        onError={() => setImgError(true)}
        style={{
          width: "82px",
          height: "82px",
          borderRadius: "50%",
          objectFit: "cover",
          objectPosition: "center top",
          border: "1px solid var(--border)",
          display: "block",
        }}
      />
    );
  }
  return <div className="profile-photo-placeholder">{emoji}</div>;
}

function SurvivorProfile({ survivor }) {
  return (
    <div className="profile-card">
      <div className="profile-top">
        <div className="profile-photo-wrap">
          <ProfilePhoto survivor={survivor} />
        </div>
        <div className="profile-name">{survivor.name}</div>
        <div className="profile-role">식별 ID 번호: {maskId(survivor.id)}</div>
      </div>
      <div className="profile-body">
        <Info label="성별" value={survivor.sex ?? "-"} />
        <Info label="전화번호" value={survivor.phone_number ?? "-"} mono />
        <Info label="얼굴 사진" value={survivor.face ? "등록됨" : "미등록"} warn={!survivor.face} />
      </div>
    </div>
  );
}

function Info({ label, value, mono, warn }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${mono ? "mono-cell" : ""}`} style={warn ? { color: "var(--red-light)" } : undefined}>
        {value}
      </span>
    </div>
  );
}

export default function WorkerPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { filteredSurvivors, loading, error } = useSurvivors(query);

  const selected = filteredSurvivors.find((s) => s.id === selectedId) || filteredSurvivors[0];

  useEffect(() => {
    if (filteredSurvivors.length > 0 && !selectedId) {
      setSelectedId(filteredSurvivors[0].id);
    }
  }, [filteredSurvivors, selectedId]);

  return (
    <AresShell route="worker" title="구조대상자 신원정보">
      <main className="content">
        <section className="main-grid">
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="ti ti-id-badge-2" /> 목록</span>
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
                  <tr><th>이름</th><th>성별</th><th>전화번호</th></tr>
                </thead>
                <tbody>
                  {filteredSurvivors.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", color: "var(--gray)", padding: "1.5rem" }}>
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                  {filteredSurvivors.map((s) => (
                    <tr key={s.id} className={selected?.id === s.id ? "selected" : ""} onClick={() => setSelectedId(s.id)}>
                      <td>
                        <div className="name-cell">
                          <div className="avatar-placeholder">{s.sex === "여" ? "👩" : "🧑"}</div>
                          <span className="name-text">{s.name}</span>
                        </div>
                      </td>
                      <td>{s.sex ?? "-"}</td>
                      <td className="mono-cell">{s.phone_number ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <aside className="detail-panel">
            {selected ? <SurvivorProfile survivor={selected} /> : <div className="placeholder-panel"><div className="ph-icon">👆</div><p>구조대상자를 선택하세요</p></div>}
          </aside>
        </section>
      </main>
    </AresShell>
  );
}