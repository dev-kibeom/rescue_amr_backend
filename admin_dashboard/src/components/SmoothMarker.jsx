import { useEffect, useRef, useState } from "react";

export default function SmoothMarker({ targetX, targetY, isOrange, title }) {
  const [currentPos, setCurrentPos] = useState({ x: targetX, y: targetY });
  const requestRef = useRef(null);
  
  // 가속도 제어 변수 (0.1 = 부드러움, 1.0 = 즉시 반응)
  const LERP_FACTOR = 0.12; 

  useEffect(() => {
    const animate = () => {
      setCurrentPos((prev) => {
        // 현재 위치와 목적지(target) 사이의 거리를 계산하여 매 프레임 조금씩 이동
        const nextX = prev.x + (targetX - prev.x) * LERP_FACTOR;
        const nextY = prev.y + (targetY - prev.y) * LERP_FACTOR;

        // 목적지에 매우 근접하면 프레임 구동을 멈추고 고정
        if (Math.abs(nextX - targetX) < 0.05 && Math.abs(nextY - targetY) < 0.05) {
          return { x: targetX, y: targetY };
        }

        // 계속 애니메이션 루프 실행
        requestRef.current = requestAnimationFrame(animate);
        return { x: nextX, y: nextY };
      });
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [targetX, targetY]);

  return (
    <div
      className={`robot-marker ${isOrange ? "orange" : ""}`}
      style={{
        left: `${currentPos.x}%`,
        top: `${currentPos.y}%`,
        transform: "translate(-50%, -50%)", // 보간 정밀도를 위해 마커 중심점 고정
        position: "absolute",
        zIndex: 10
      }}
      title={title}
    >
      🤖
    </div>
  );
}