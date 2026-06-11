import React from "react";
import { logger } from "../utils/logger";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: "" };
  }

  static getDerivedStateFromError(error) {
    // 다음 렌더링 때 에러 대체 UI가 나오도록 상태 변경
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 크리티컬 에러로 분류하여 관제 로그에 기록
    logger.error("컴포넌트 크래시 발생:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "1.5rem", background: "#2a1b1b", border: "1px dashed var(--red-light)", borderRadius: "8px", color: "var(--red-light)", margin: "0.5rem" }}>
          <h4>⚠️ 모듈 렌더링 오류</h4>
          <p style={{ fontSize: "0.85rem", color: "#aaa" }}>실시간 관제 데이터를 파싱하는 중 예외가 발생했습니다. 로그를 확인하세요.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ background: "var(--red)", color: "white", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}
          >
            모듈 재가동
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}