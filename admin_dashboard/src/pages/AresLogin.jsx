import { useState } from "react";

const LOGIN_API_URL = import.meta.env.VITE_LOGIN_API_URL;

function AresLogo() {
  return (
    <svg className="ares-logo-svg" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sg" x1="36" y1="4" x2="36" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e53935" />
          <stop offset="100%" stopColor="#8b0000" />
        </linearGradient>
      </defs>
      <path d="M36 5L8 17V38C8 53 21 64 36 68C51 64 64 53 64 38V17L36 5Z" fill="url(#sg)" />
      <path d="M36 5L8 17V38C8 53 21 64 36 68C51 64 64 53 64 38V17L36 5Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <path d="M36 54C36 54 26 46 26 38C26 34 28 32 30 31C30 35.5 32 37 33.5 36C31 33 32 27 36 24C36 24 34 30 37 32C38.5 30 37.5 26 40 24.5C41.5 29 40 34 41 36C43 34 42 30 44.5 29C46 33 44.5 39 44.5 39C44.5 46 36 54 36 54Z" fill="rgba(255,220,80,0.95)" />
      <path d="M36 54C36 54 29 48 29 41C29 38 30.5 36 33 35C33 38.5 34.5 39.5 35.5 38.5C34 36 34.5 31.5 36.5 29C36.5 29 35.5 33.5 38 35C39 33.5 38.5 30.5 40 29.5C41 33 40 36.5 41 38C42.5 36.5 42 33.5 43.5 32.5C44.5 36 43.5 41 43.5 41C43.5 48 36 54 36 54Z" fill="rgba(255,155,20,0.9)" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="ares-lock-icon" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function AresLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError("");

    if (!username.trim() || !password) {
      setError("⚠ 아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    if (!LOGIN_API_URL) {
      sessionStorage.setItem("ares_login_time", Date.now());
      window.location.hash = "sync";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        sessionStorage.setItem("ares_login_time", Date.now());
        window.location.hash = "sync";
      } else {
        setError("⚠ 아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch {
      setError("⚠ 로그인 서버 연결을 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="ares-wrap">
      <div className="ares-card">
        <div className="ares-logo-area">
          <AresLogo />
          <div className="ares-logo-title">ARES</div>
          <div className="ares-logo-sub">소방 로봇 관제 시스템</div>
        </div>

        <div className="ares-form-group">
          <label className="ares-label">아이디</label>
          <input
            className="ares-input"
            type="text"
            placeholder="아이디를 입력하세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="ares-form-group">
          <label className="ares-label">비밀번호</label>
          <div className="ares-input-wrap">
            <input
              className="ares-input"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <LockIcon />
          </div>
        </div>

        <button className="ares-btn" onClick={login} disabled={loading}>
          {loading ? "인증 확인 중..." : "로그인"}
        </button>

        {error && <p className="ares-error">{error}</p>}

        <div className="ares-footer">© 2025 ARES. All rights reserved.</div>
      </div>
    </div>
  );
}