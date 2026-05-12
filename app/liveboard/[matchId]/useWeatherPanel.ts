// app/liveboard/[matchId]/useWeatherPanel.ts
import { useAuth } from "@/context/AuthContext";
import { fetchMatchWeather } from "@/src/features/liveboard/api";
import {
  ForeCastDto,
  NowCastDto,
  WeatherApiStatus,
} from "@/src/features/liveboard/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type FetchState = "LOADING" | "SUCCESS" | "ERROR";

interface UseWeatherPanelReturn {
  fetchState: FetchState;
  stadiumName: string | null;
  weatherStatus: WeatherApiStatus;
  nowCast: NowCastDto | null;
  foreCast: ForeCastDto[];
  isLoggedIn: boolean;
  handleRetry: () => void;
}

/**
 * useWeatherPanel
 *
 * Why: WeatherPanel의 기상청 API 페칭 로직을 UI로부터 분리.
 * TanStack Query를 도입하여 데이터 캐싱 및 탭 전환 시 중복 로딩 방지.
 */
export function useWeatherPanel(matchId: string): UseWeatherPanelReturn {
  const { user } = useAuth();
  const isLoggedIn = !!user?.userId;

  const {
    data,
    status,
    refetch,
  } = useQuery({
    queryKey: ["liveboard", "weather", matchId],
    queryFn: () => fetchMatchWeather(matchId),
    enabled: isLoggedIn && !!matchId,
    staleTime: 1000 * 60 * 10, // 10분 캐시 유지
  });

  const fetchState: FetchState =
    status === "pending" ? "LOADING" : status === "error" ? "ERROR" : "SUCCESS";

  const stadiumName = data?.stadiumName ?? null;
  const weatherStatus = data?.status ?? "SUCCESS";
  const nowCast = data?.nowCast ?? null;
  const foreCast = useMemo(() => data?.foreCast ?? [], [data]);

  return {
    fetchState,
    stadiumName,
    weatherStatus,
    nowCast,
    foreCast,
    isLoggedIn,
    handleRetry: refetch,
  };
}
