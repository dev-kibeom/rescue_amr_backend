import { useEffect, useState } from "react";

export default function useClock(options) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("ko-KR", options));

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("ko-KR", options));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [options]);

  return time;
}
