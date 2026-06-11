import { useCallback, useEffect, useState } from "react";

const API_BASE = "http://localhost:8001/api";
const POLL_INTERVAL = 3000;

const globalMonitorCache = {
  robots: [],
  liveTelemetry: {},
  survivorStats: { confirmed: 0, unknown: 0 },
  cameraCoverage: {},
  connStatus: { backend: 'ok', db: 'ok' }
};

export default function useMonitor() {
  const [robots, setRobots] = useState(globalMonitorCache.robots);
  const [liveTelemetry, setLiveTelemetry] = useState(globalMonitorCache.liveTelemetry);
  const [survivorStats, setSurvivorStats] = useState(globalMonitorCache.survivorStats);
  const [cameraCoverage, setCameraCoverage] = useState(globalMonitorCache.cameraCoverage);
  const [connStatus, setConnStatus] = useState(globalMonitorCache.connStatus);

  const fetchStatus = useCallback(async () => {
    try {
      const [robotRes, survivorRes] = await Promise.all([
        fetch(`${API_BASE}/robots`),
        fetch(`${API_BASE}/survivor-logs?limit=200`),
      ]);

      if (robotRes.ok) {
        const data = await robotRes.json();
        const robotList = Array.isArray(data.robots) ? data.robots : Array.isArray(data) ? data : [];
        const nextDbStatus = data.db_status ?? 'ok';
        
        setRobots((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(robotList)) return prev;
          globalMonitorCache.robots = robotList;
          return robotList;
        });

        setConnStatus((prev) => {
          const nextStatus = { backend: 'ok', db: nextDbStatus };
          if (JSON.stringify(prev) === JSON.stringify(nextStatus)) return prev;
          globalMonitorCache.connStatus = nextStatus;
          return nextStatus;
        });
      }

      if (survivorRes.ok) {
        const logs = await survivorRes.json();
        const confirmed = new Set(logs.filter((l) => l.survivor_id).map((l) => l.survivor_id)).size;
        const unknown = logs.filter((l) => !l.survivor_id).length;
        const nextStats = { confirmed, unknown };

        setSurvivorStats((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(nextStats)) return prev;
          globalMonitorCache.survivorStats = nextStats;
          return nextStats;
        });
      }
    } catch (err) {
      setConnStatus((prev) => {
        const nextStatus = { backend: 'error', db: 'ok' };
        if (JSON.stringify(prev) === JSON.stringify(nextStatus)) return prev;
        globalMonitorCache.connStatus = nextStatus;
        return nextStatus;
      });
    }
  }, []);

  // 💡 [완벽 교정] 외부 원천 훅 변수명과 충돌하지 않도록 원본 오리지널 상태 변경 셋 함수 직접 타겟팅
  const updateLiveTelemetry = useCallback((id, data) => {
    if (!id || !data) return; // 하드웨어 방어선 추가
    
    setLiveTelemetry((prev) => {
      let nextState = { ...prev };
      if (data.type === "battery") {
        nextState[id] = { ...nextState[id], battery: data.value };
      } else if (data.type === "camera_coverage") {
        if (data.poses && data.poses.length > 0) {
          const latestPose = data.poses[data.poses.length - 1];
          nextState[id] = { ...nextState[id], pos_x: latestPose.x, pos_y: latestPose.y };
        }
      }
      globalMonitorCache.liveTelemetry = nextState;
      return nextState;
    });
  }, []);

  const updateCameraCoverage = useCallback((id, points) => {
    if (!id || !points) return; // 하드웨어 방어선 추가
    
    setCameraCoverage((prev) => {
      const nextState = { ...prev, [id]: points };
      globalMonitorCache.cameraCoverage = nextState;
      return nextState;
    });
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStatus]);

  return {
    robots,
    liveTelemetry,
    setLiveTelemetry: updateLiveTelemetry,
    cameraCoverage,
    setCameraCoverage: updateCameraCoverage,
    survivorStats,
    connStatus
  };
}