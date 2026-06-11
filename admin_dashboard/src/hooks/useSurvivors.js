import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { logger } from "../utils/logger";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default function useSurvivors(query) {
  const [survivors, setSurvivors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 조회를 공통 함수로 분리
  const fetchSurvivors = useCallback(async () => {
    try {
      if (!supabase) throw new Error("Supabase 설정이 인지되지 않았습니다.");
      const { data, error: dbError } = await supabase
        .from("survivors")
        .select("id, name, sex, phone_number, face");
      
      if (dbError) throw dbError;
      setSurvivors((prev) => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
      setError(null);
    } catch (err) {
      logger.warn("Supabase 데이터 동기화 실패:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. 최초 초기 데이터 로드
    fetchSurvivors();

    if (!supabase) return;

    // 2. 💡 [핵심] Supabase 실시간 테이블 구독(웹소켓 채널 개방)
    const channel = supabase
      .channel("public-survivors-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "survivors" },
        (payload) => {
          logger.info("DB 실시간 변경 이벤트 캡처 완료:", payload.eventType);
          // 데이터가 변동되면 무식한 타이머 대신 이벤트 드리븐으로 즉시 Fetch 실행
          fetchSurvivors();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logger.info("Supabase 실시간 관제 채널과 성공적으로 동기화되었습니다.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSurvivors]);

  const filteredSurvivors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return survivors
      .filter((s) => {
        const text = `${s.name} ${s.phone_number ?? ""}`.toLowerCase();
        return !q || text.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [query, survivors]);

  return { filteredSurvivors, survivors, loading, error };
}