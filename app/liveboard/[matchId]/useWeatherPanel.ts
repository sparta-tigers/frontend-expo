// app/liveboard/[matchId]/useWeatherPanel.ts
import { useAuth } from "@/context/AuthContext";
import { fetchMatchWeather } from "@/src/features/liveboard/api";
import {
  ForeCastDto,
  NowCastDto,
  WeatherApiStatus,
} from "@/src/features/liveboard/types";
import { useCallback, useEffect, useRef, useState } from "react";

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
 * mountedRef로 비동기 경합 방어 (언마운트 후 setState 금지).
 */
export function useWeatherPanel(matchId: string): UseWeatherPanelReturn {
  const { user } = useAuth();
  const isLoggedIn = !!user?.userId;
  const mountedRef = useRef(true);

  const [fetchState, setFetchState] = useState<FetchState>("LOADING");
  const [stadiumName, setStadiumName] = useState<string | null>(null);
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherApiStatus>("SUCCESS");
  const [nowCast, setNowCast] = useState<NowCastDto | null>(null);
  const [foreCast, setForeCast] = useState<ForeCastDto[]>([]);

  const loadWeather = useCallback(() => {
    if (!isLoggedIn) {
      setFetchState("ERROR");
      return;
    }

    setFetchState("LOADING");

    fetchMatchWeather(matchId)
      .then((data) => {
        if (!mountedRef.current) return;
        if (!isLoggedIn) return;
        setStadiumName(data.stadiumName ?? null);
        setWeatherStatus(data.status ?? "SUCCESS");
        setNowCast(data.nowCast ?? null);
        setForeCast(data.foreCast ?? []);
        setFetchState("SUCCESS");
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setFetchState("ERROR");
      });
  }, [matchId, isLoggedIn]);

  useEffect(() => {
    mountedRef.current = true;
    loadWeather();
    return () => {
      mountedRef.current = false;
    };
  }, [loadWeather]);

  const handleRetry = useCallback(() => {
    loadWeather();
  }, [loadWeather]);

  return {
    fetchState,
    stadiumName,
    weatherStatus,
    nowCast,
    foreCast,
    isLoggedIn,
    handleRetry,
  };
}
