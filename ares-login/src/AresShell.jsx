import { navigate } from "./aresRouting";
import useClock from "./useClock";

const navItems = [
  { route: "worker", icon: "ti-users", label: <>작업자<br />관리</> },
  { route: "monitor", icon: "ti-robot", label: <>로봇<br />모니터링</> },
  { route: "report", icon: "ti-file-report", label: "보고서" },
];

export default function AresShell({ route, title, subtitle, compact = false, children }) {
  const time = useClock();

  return (
    <div className={`ares-app ${compact ? "ares-app-compact" : ""}`}>
      <aside className="ares-sidebar">
        <button className="sidebar-logo" type="button" onClick={() => navigate("login")}>
          <span className="emblem">🚒</span>
          <span>ARES<br />관제</span>
        </button>

        <nav className="sidebar-nav" aria-label="ARES navigation">
          {navItems.map((item) => (
            <button
              key={item.route}
              className={`nav-item ${route === item.route ? "active" : ""}`}
              type="button"
              onClick={() => navigate(item.route)}
            >
              <i className={`ti ${item.icon} icon`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="logout-btn" type="button" onClick={() => navigate("login")}>
          <i className="ti ti-logout" />
          <span>로그아웃</span>
        </button>
      </aside>

      <div className="ares-main">
        <header className="ares-topbar">
          <div className="topbar-left">
            <span className="topbar-title">{title}</span>
            <span className="topbar-sub">{subtitle}</span>
            {route === "monitor" && <span className="alert-chip"><span className="dot" />MISSION ACTIVE</span>}
          </div>
          <div className="topbar-right">
            <span className="topbar-time">{time}</span>
            <div className="topbar-user">
              <div className="user-avatar">🧑‍🚒</div>
              <span className="user-name">관리자</span>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
