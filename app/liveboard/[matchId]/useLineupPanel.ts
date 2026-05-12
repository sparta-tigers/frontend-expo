// app/liveboard/[matchId]/useLineupPanel.ts
import { useAuth } from "@/context/AuthContext";
import { fetchMatchLineup } from "@/src/features/liveboard/api";
import { LineupRowDto } from "@/src/features/liveboard/types";
import { useCallback, useEffect, useRef, useState } from "react";

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
 * cancelledRef로 컴포넌트 언마운트 후의 비동기 상태 업데이트를 차단(Race Condition 방어).
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
  const cancelledRef = useRef(false);

  const loadLineup = useCallback(() => {
    if (!isLoggedIn) {
      setFetchState("ERROR");
      return;
    }

    setFetchState("LOADING");

    fetchMatchLineup(matchId)
      .then((data) => {
        if (cancelledRef.current) return;
        if (!isLoggedIn) return;
        setHomeBatters(data.homeBatters ?? []);
        setAwayBatters(data.awayBatters ?? []);
        setFetchState("SUCCESS");
      })
      .catch(() => {
        if (cancelledRef.current) return;
        setFetchState("ERROR");
      });
  }, [matchId, isLoggedIn]);

  useEffect(() => {
    cancelledRef.current = false;
    loadLineup();
    return () => {
      cancelledRef.current = true;
    };
  }, [loadLineup]);

  const handleRetry = useCallback(() => {
    cancelledRef.current = false;
    loadLineup();
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
