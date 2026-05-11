// app/liveboard/[matchId]/useLineupPanel.ts
import { useAuth } from "@/context/AuthContext";
import { fetchMatchLineup } from "@/src/features/liveboard/api";
import { LineupRowDto } from "@/src/features/liveboard/types";
import { useCallback, useEffect, useState } from "react";

type FetchState = "LOADING" | "SUCCESS" | "ERROR";
type ActiveTeam = "HOME" | "AWAY";

interface UseLineupPanelReturn {
  activeTeam: ActiveTeam;
  setActiveTeam: (t: ActiveTeam) => void;
  fetchState: FetchState;
  currentLineup: LineupRowDto[];
  currentTeamName: string;
  isLoggedIn: boolean;
  handleRetry: () => void;
}

/**
 * useLineupPanel
 *
 * Why: LineupPanel의 데이터 페칭·팀 토글 상태를 UI로부터 분리.
 * cancelled 플래그로 비동기 경합(Race Condition) 방어.
 */
export function useLineupPanel(
  matchId: string,
  homeTeamName: string,
  awayTeamName: string,
): UseLineupPanelReturn {
  const { user } = useAuth();
  const isLoggedIn = !!user?.userId;

  const [activeTeam, setActiveTeam] = useState<ActiveTeam>("HOME");
  const [fetchState, setFetchState] = useState<FetchState>("LOADING");
  const [homeBatters, setHomeBatters] = useState<LineupRowDto[]>([]);
  const [awayBatters, setAwayBatters] = useState<LineupRowDto[]>([]);

  const loadLineup = useCallback(
    (cancelled: { current: boolean }) => {
      if (!isLoggedIn) {
        setFetchState("ERROR");
        return;
      }

      setFetchState("LOADING");

      fetchMatchLineup(matchId)
        .then((data) => {
          if (cancelled.current) return;
          if (!isLoggedIn) return;
          setHomeBatters(data.homeBatters ?? []);
          setAwayBatters(data.awayBatters ?? []);
          setFetchState("SUCCESS");
        })
        .catch(() => {
          if (cancelled.current) return;
          setFetchState("ERROR");
        });
    },
    [matchId, isLoggedIn],
  );

  useEffect(() => {
    const cancelled = { current: false };
    loadLineup(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [loadLineup]);

  const handleRetry = useCallback(() => {
    const cancelled = { current: false };
    loadLineup(cancelled);
  }, [loadLineup]);

  const currentLineup = activeTeam === "HOME" ? homeBatters : awayBatters;
  const currentTeamName =
    activeTeam === "HOME" ? homeTeamName : awayTeamName;

  return {
    activeTeam,
    setActiveTeam,
    fetchState,
    currentLineup,
    currentTeamName,
    isLoggedIn,
    handleRetry,
  };
}
