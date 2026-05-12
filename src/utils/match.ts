import { theme } from "@/src/styles/theme";

/**
 * 경기 결과 정보를 담는 인터페이스
 */
export interface MatchResultInfo {
  text: string;
  color: string;
  emoji: string;
}

/**
 * 경기 스코어와 응원 팀 정보를 바탕으로 승/무/패 결과를 계산합니다. (DRY)
 * 
 * @param homeScore 홈 팀 점수
 * @param awayScore 어웨이 팀 점수
 * @param homeTeamCode 홈 팀 코드
 * @param awayTeamCode 어웨이 팀 코드
 * @param favoriteTeamCode 사용자의 응원 팀 코드
 * @returns MatchResultInfo 또는 null (데이터가 부족한 경우)
 */
export const calculateMatchResult = (
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  homeTeamCode: string,
  awayTeamCode: string,
  favoriteTeamCode: string | null | undefined
): MatchResultInfo | null => {
  // 🚨 앙드레 카파시: Zero-Magic. 명시적인 null/undefined 체크.
  if (homeScore == null || awayScore == null || !favoriteTeamCode) {
    return null;
  }

  const isHome = homeTeamCode === favoriteTeamCode;
  const isAway = awayTeamCode === favoriteTeamCode;

  // 응원 팀이 참여한 경기가 아닌 경우
  if (!isHome && !isAway) {
    return { 
      text: "MATCH", 
      color: theme.colors.text.secondary, 
      emoji: "🏟️" 
    };
  }

  const myScore = isHome ? homeScore : awayScore;
  const opponentScore = isHome ? awayScore : homeScore;

  if (myScore > opponentScore) {
    return { 
      text: "WIN", 
      color: theme.colors.brand.mint, 
      emoji: "😊" 
    };
  }
  
  if (myScore < opponentScore) {
    return { 
      text: "LOSE", 
      color: theme.colors.error, 
      emoji: "😭" 
    };
  }

  return { 
    text: "DRAW", 
    color: theme.colors.text.secondary, 
    emoji: "😐" 
  };
};
