import { ThemeColorPath } from "@/src/shared/types/theme";
import { findTeamMeta } from "./team";

/**
 * 경기 결과 정보를 담는 인터페이스
 */
export interface MatchResultInfo {
  text: string;
  color: ThemeColorPath;
  emoji: string;
}

/**
 * 🧮 calculateMatchResult: 경기 스코어와 응원 팀 정보를 바탕으로 승/무/패 결과를 계산 (Deterministic)
 * 
 * Why: 
 * 1. UI 컴포넌트에서 직접적인 승패 계산 로직을 분리하여 '멍청한 View'를 유지함.
 * 2. findTeamMeta를 통해 구단 코드가 HT, KIA 등으로 들어오더라도 표준화된 TeamCode로 변환 후 비교함 (레거시 호환성).
 * 3. 응원 팀이 참여하지 않은 경기는 'MATCH' 상태로 처리하여 시각적 정합성을 보장함.
 *
 * @param homeScore 홈 팀 점수
 * @param awayScore 어웨이 팀 점수
 * @param homeTeamCode 홈 팀 코드 (HT, KIA 등)
 * @param awayTeamCode 어웨이 팀 코드 (SK, SSG 등)
 * @param favoriteTeamCode 사용자의 응원 팀 코드
 * @returns MatchResultInfo 또는 null (데이터가 부족한 경우)
 */
export const calculateMatchResult = (
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  homeTeamCode: string,
  awayTeamCode: string,
  favoriteTeamCode: string | null | undefined,
): MatchResultInfo | null => {
  // 🚨 앙드레 카파시: Zero-Magic. 명시적인 null/undefined/empty 체크.
  if (homeScore == null || awayScore == null || !favoriteTeamCode || !homeTeamCode || !awayTeamCode) {
    return null;
  }

  const homeMeta = findTeamMeta(homeTeamCode);
  const awayMeta = findTeamMeta(awayTeamCode);
  const favoriteMeta = findTeamMeta(favoriteTeamCode);

  const isHome = homeMeta.id === favoriteMeta.id;
  const isAway = awayMeta.id === favoriteMeta.id;

  // 응원 팀이 참여한 경기가 아닌 경우
  if (!isHome && !isAway) {
    return {
      text: "MATCH",
      color: "text.secondary",
      emoji: "🏟️",
    };
  }

  const myScore = isHome ? homeScore : awayScore;
  const opponentScore = isHome ? awayScore : homeScore;

  if (myScore > opponentScore) {
    return {
      text: "WIN",
      color: "brand.mint",
      emoji: "😊",
    };
  }

  if (myScore < opponentScore) {
    return {
      text: "LOSE",
      color: "error",
      emoji: "😭",
    };
  }

  return {
    text: "DRAW",
    color: "text.secondary",
    emoji: "😐",
  };
};
