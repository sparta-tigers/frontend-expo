// app/liveboard/[matchId]/useLineupPanel.ts
import { useAuth } from "@/context/AuthContext";
import { fetchMatchLineup } from "@/src/features/liveboard/api";
import { LineupRowDto } from "@/src/features/liveboard/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { matchKeys } from "../../match/queries";

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
 * TanStack Query를 도입하여 데이터 캐싱 및 탭 전환 시 중복 로딩 방지.
 */
export function useLineupPanel(
  matchId: string,
  homeTeamName: string,
  awayTeamName: string,
): UseLineupPanelReturn {
  const { user } = useAuth();
  const isLoggedIn = !!user?.userId;

  const [activeTeam, setActiveTeam] = useState<ActiveTeam>("HOME");

  const {
    data,
    status,
    refetch,
  } = useQuery({
    queryKey: matchKeys.liveboard.lineup(matchId),
    queryFn: () => fetchMatchLineup(matchId),
    enabled: isLoggedIn && !!matchId,
    staleTime: 1000 * 60 * 5, // 5분 캐시 유지
  });

  const fetchState: FetchState =
    status === "pending" ? "LOADING" : status === "error" ? "ERROR" : "SUCCESS";

  const homeBatters = useMemo(() => data?.homeBatters ?? [], [data]);
  const awayBatters = useMemo(() => data?.awayBatters ?? [], [data]);

  const currentLineup = activeTeam === "HOME" ? homeBatters : awayBatters;
  const currentTeamName = activeTeam === "HOME" ? homeTeamName : awayTeamName;

  return {
    activeTeam,
    setActiveTeam,
    fetchState,
    currentLineup,
    currentTeamName,
    isLoggedIn,
    handleRetry: refetch,
  };
}
