import { useState, useMemo, useEffect } from "react";
import { BroadcastItem } from "../types";

/**
 * useTextBroadcast Hook
 * 
 * Why: 텍스트 중계의 이닝 필터링 및 초기 이닝 결정 로직을 뷰에서 분리.
 * 결정론적(Deterministic) 초기 상태 설정을 통해 UX 깜빡임을 방지함.
 */
export const useTextBroadcast = (inningTexts?: { [inning: number]: BroadcastItem[] }) => {
  // 1. [Deterministic] 데이터가 있는 가장 높은 이닝을 초기값으로 설정
  const initialInning = useMemo(() => {
    if (!inningTexts) return 1;
    const innings = Object.keys(inningTexts).map(Number).filter(n => inningTexts[n].length > 0);
    return innings.length > 0 ? Math.max(...innings) : 1;
  }, [inningTexts]);

  const [activeInning, setActiveInning] = useState<number>(initialInning);

  // initialInning 변경 시 (비동기 데이터 로드 완료 등) 상태 동기화
  useEffect(() => {
    setActiveInning(initialInning);
  }, [initialInning]);

  // 2. 가용한 이닝 리스트 (칩 표시용)
  const availableInnings = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 10은 연장
  }, []);

  // 3. 선택된 이닝의 데이터 필터링 (최신 데이터가 상단으로 오도록 reverse 고려 가능)
  // 현재 데이터는 백엔드에서 역순으로 올 수 있으므로 그대로 사용하거나 필요시 가공
  const filteredBroadcast = useMemo(() => {
    return inningTexts ? inningTexts[activeInning] || [] : [];
  }, [inningTexts, activeInning]);

  return {
    activeInning,
    setActiveInning,
    availableInnings,
    filteredBroadcast,
  };
};
