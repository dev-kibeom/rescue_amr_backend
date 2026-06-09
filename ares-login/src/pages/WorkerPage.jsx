import { useMemo, useState } from "react";
import AresShell from "../AresShell";

const statusMap = {
  active: ["ACTIVE", "active"],
  "on-site": ["현장투입", "on-site"],
  inactive: ["대기", "inactive"],
};

const sampleWorkers = [
  { id: 1, name: "김로키", birth: "1988", phone: "010-4821-1190", role: "구조", status: "on-site", rank: "소방장", team: "ARES-1", since: "2015", emergency: "010-9000-1001" },
  { id: 2, name: "박하늘", birth: "1991", phone: "010-3312-2048", role: "응급", status: "active", rank: "소방교", team: "ARES-1", since: "2018", emergency: "010-9000-1002" },
  { id: 3, name: "이준서", birth: "1985", phone: "010-7741-3030", role: "운용", status: "on-site", rank: "소방위", team: "Robot Ops", since: "2012", emergency: "010-9000-1003" },
  { id: 4, name: "최다은", birth: "1994", phone: "010-5280-4422", role: "통신", status: "active", rank: "소방사", team: "Command", since: "2021", emergency: "010-9000-1004" },
  { id: 5, name: "정민규", birth: "1989", phone: "010-8411-7729", role: "발주", status: "inactive", rank: "소방교", team: "Supply", since: "2017", emergency: "010-9000-1005" },
  { id: 6, name: "한서윤", birth: "1992", phone: "010-6681-1934", role: "입고", status: "active", rank: "소방사", team: "Supply", since: "2020", emergency: "010-9000-1006" },
  { id: 7, name: "오태민", birth: "1987", phone: "010-7092-4011", role: "입고", status: "inactive", rank: "소방장", team: "Supply", since: "2014", emergency: "010-9000-1007" },
  { id: 8, name: "강유진", birth: "1990", phone: "010-1902-6077", role: "구조", status: "on-site", rank: "소방교", team: "ARES-2", since: "2016", emergency: "010-9000-1008" },
];

const emojis = ["👨‍🚒", "👩‍🚒", "🧑‍🚒", "🚒", "🔥"];

function WorkerAvatar({ worker, large = false }) {
  const emoji = emojis[worker.id % emojis.length];
  return <div className={large ? "profile-photo-placeholder" : "avatar-placeholder"}>{emoji}</div>;
}

export default function WorkerPage() {
  const [workers] = useState(sampleWorkers);
  const [selectedId, setSelectedId] = useState(sampleWorkers[0].id);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return workers.filter((worker) => {
      const text = `${worker.name} ${worker.birth} ${worker.phone}`.toLowerCase();
      return (!normalizedQuery || text.includes(normalizedQuery)) && (!role || worker.role === role);
    });
  }, [query, role, workers]);

  const selected = workers.find((worker) => worker.id === selectedId) || filtered[0];
  const activeWorkers = workers.filter((worker) => worker.status !== "inactive");
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <AresShell route="worker" title="작업자 신원 관리" subtitle="WORKER IDENTITY MANAGEMENT">
      <main className="content">
        <section className="today-banner">
          <div className="banner-left">
            <h3>TODAY&apos;S CREW · {today}</h3>
            <div className="workers">
              {activeWorkers.slice(0, 5).map((worker) => (
                <span className="worker-chip" key={worker.id}><span className="dot" />{worker.name} ({worker.role})</span>
              ))}
            </div>
          </div>
          <div className="banner-stats">
            <div className="bstat"><div className="val">{workers.length}</div><div className="lbl">전체 인원</div></div>
            <div className="bstat"><div className="val green-text">{activeWorkers.length}</div><div className="lbl">현장 투입</div></div>
            <div className="bstat"><div className="val orange-text">{workers.length - activeWorkers.length}</div><div className="lbl">대기중</div></div>
          </div>
        </section>

        <section className="summary-row">
          <Summary icon="ti-flame" tone="red" value="3" label="현장 작업팀" />
          <Summary icon="ti-package-import" tone="orange" value="2" label="입고 담당" />
          <Summary icon="ti-clipboard-list" tone="green" value="1" label="발주 담당" />
          <Summary icon="ti-alert-triangle" tone="blue" value="0" label="긴급 출동" />
        </section>

        <section className="main-grid">
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="ti ti-id-badge-2" /> 작업자 목록</span>
              <div className="card-actions">
                <button className="btn-sm btn-ghost" type="button"><i className="ti ti-download" /> 내보내기</button>
                <button className="btn-sm btn-primary" type="button"><i className="ti ti-plus" /> 인원 추가</button>
              </div>
            </div>

            <div className="filter-bar">
              <label className="search-wrap">
                <i className="ti ti-search" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 생년월일, 전화번호 검색..." />
              </label>
              <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="역할 필터">
                <option value="">전체 역할</option>
                <option value="구조">구조</option>
                <option value="응급">응급</option>
                <option value="운용">운용</option>
                <option value="통신">통신</option>
                <option value="발주">발주</option>
                <option value="입고">입고</option>
              </select>
            </div>

            <table>
              <thead>
                <tr><th>NAME</th><th>BIRTH</th><th>PHONE</th><th>ROLE</th><th>STATUS</th></tr>
              </thead>
              <tbody>
                {filtered.map((worker) => (
                  <tr key={worker.id} className={selected?.id === worker.id ? "selected" : ""} onClick={() => setSelectedId(worker.id)}>
                    <td><div className="name-cell"><WorkerAvatar worker={worker} /><span className="name-text">{worker.name}</span></div></td>
                    <td className="mono-cell">{worker.birth}</td>
                    <td className="mono-cell">{worker.phone}</td>
                    <td>{worker.role}</td>
                    <td><span className={`badge ${worker.status}`}>{statusMap[worker.status][0]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="detail-panel">
            {selected ? <WorkerProfile worker={selected} /> : <div className="placeholder-panel"><div className="ph-icon">👆</div><p>작업자를 선택하세요</p></div>}
            <div className="quick-card">
              <div className="quick-title">QUICK ACTIONS</div>
              <button className="quick-btn" type="button"><i className="ti ti-user-plus" /> 신규 작업자 등록</button>
              <button className="quick-btn" type="button"><i className="ti ti-printer" /> 명단 출력</button>
              <button className="quick-btn" type="button"><i className="ti ti-bell-ringing" /> 전체 호출</button>
              <button className="quick-btn" type="button"><i className="ti ti-history" /> 근무 이력 조회</button>
            </div>
          </aside>
        </section>
      </main>
    </AresShell>
  );
}

function Summary({ icon, tone, value, label }) {
  return (
    <div className="summary-card">
      <div className={`sum-icon ${tone}`}><i className={`ti ${icon}`} /></div>
      <div><div className="sum-val">{value}</div><div className="sum-lbl">{label}</div></div>
    </div>
  );
}

function WorkerProfile({ worker }) {
  return (
    <div className="profile-card">
      <div className="profile-top">
        <div className="profile-photo-wrap">
          <WorkerAvatar worker={worker} large />
          <div className={`profile-status ${worker.status === "inactive" ? "off" : ""}`} />
        </div>
        <div className="profile-name">{worker.name}</div>
        <div className="profile-role">{worker.rank} · {worker.team}</div>
      </div>
      <div className="profile-body">
        <Info label="생년월일" value={worker.birth} />
        <Info label="전화번호" value={worker.phone} />
        <Info label="역할" value={worker.role} />
        <Info label="소속팀" value={worker.team} />
        <div className="info-row"><span className="info-label">상태</span><span className={`badge ${worker.status}`}>{statusMap[worker.status][0]}</span></div>
        <Info label="임용연도" value={`${worker.since}년`} />
        <Info label="비상연락" value={worker.emergency} mono />
      </div>
    </div>
  );
}

function Info({ label, value, mono }) {
  return <div className="info-row"><span className="info-label">{label}</span><span className={`info-value ${mono ? "mono-cell" : ""}`}>{value}</span></div>;
}
