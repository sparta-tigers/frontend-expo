import { findTeamMeta } from "@/src/utils/team";
import { MatchScheduleDto, MatchSummary, MatchDetail, MatchTeamInfo, RankingRowDto, RankingUIModel } from "./types";
import { LiveBoardRoomDto } from "@/src/features/liveboard/types";

/**
 * 🏛️ MatchMapper: API DTO를 UI 친화적인 모델로 변환하는 중앙 로직
 * 
 * Why: 
 * 1. 백엔드 DTO 구조가 변경되어도 UI 모델은 유지하여 영향 범위를 최소화함.
 * 2. findTeamMeta를 통해 모든 경기 데이터에 구단 메타데이터(TeamMeta)를 강제 바인딩함.
 * 3. Fail-safe 처리를 통해 데이터 부재 시에도 UI가 깨지지 않도록 방어함.
 */
export class MatchMapper {
  /**
   * 📋 일정 DTO를 요약 UI 모델로 변환
   */
  static toSummary(dto: MatchScheduleDto, myTeamCode: string): MatchSummary {
    const isHome = dto.location === "H";
    const homeBackendCode = isHome ? myTeamCode : dto.opponentCode;
    const awayBackendCode = isHome ? dto.opponentCode : myTeamCode;

    const homeMeta = findTeamMeta(homeBackendCode) || findTeamMeta("DEFAULT");
    const awayMeta = findTeamMeta(awayBackendCode) || findTeamMeta("DEFAULT");

    const homeTeam: MatchTeamInfo = {
      code: homeBackendCode,
      name: homeMeta.shortName,
      meta: homeMeta,
    };

    const awayTeam: MatchTeamInfo = {
      code: awayBackendCode,
      name: awayMeta.shortName,
      meta: awayMeta,
    };

    return {
      matchId: dto.matchId,
      day: dto.day,
      startTime: dto.timeText,
      homeTeam,
      awayTeam,
      stadium: homeMeta.stadium,
      isLive: false,
      displayStatus: dto.timeText,
      location: dto.location,
    };
  }

  /**
   * 🔬 라이브보드 룸 DTO를 상세 UI 모델로 변환
   */
  static toDetail(dto: LiveBoardRoomDto, myTeamCode?: string): MatchDetail {
    const homeMeta = findTeamMeta(dto.homeTeamCode) || findTeamMeta("DEFAULT");
    const awayMeta = findTeamMeta(dto.awayTeamCode) || findTeamMeta("DEFAULT");

    const homeTeam: MatchTeamInfo = {
      code: dto.homeTeamCode,
      name: dto.homeTeamName,
      meta: homeMeta,
    };

    const awayTeam: MatchTeamInfo = {
      code: dto.awayTeamCode,
      name: dto.awayTeamName,
      meta: awayMeta,
    };

    const isLive = dto.liveBoardStatus === "TODAY";
    const displayStatus = isLive ? "경기중" : (dto.liveBoardStatus === "PAST" ? "종료" : "예정");

    return {
      matchId: dto.matchId,
      day: (() => {
        if (!dto.matchTime.includes("T")) {
          throw new Error(`[MatchMapper] Invalid matchTime format: ${dto.matchTime}. Expected ISO format (YYYY-MM-DDTHH:mm:ss)`);
        }
        const datePart = dto.matchTime.split("T")[0];
        const dateSegments = datePart.split("-");
        if (dateSegments.length < 3) {
          throw new Error(`[MatchMapper] Invalid date format in matchTime: ${dto.matchTime}`);
        }
        return parseInt(dateSegments[2]);
      })(),
      startTime: (() => {
        if (!dto.matchTime.includes("T")) {
          throw new Error(`[MatchMapper] Invalid matchTime format: ${dto.matchTime}. Expected ISO format (YYYY-MM-DDTHH:mm:ss)`);
        }
        return dto.matchTime.split("T")[1].substring(0, 5);
      })(),
      homeTeam,
      awayTeam,
      stadium: dto.stadium || homeMeta.stadium,
      isLive,
      displayStatus,
      displayResult: dto.matchResult || null,
      location: myTeamCode === dto.homeTeamCode ? "H" : "A",
      liveBoardStatus: dto.liveBoardStatus,
      nowCast: dto.nowCast,
      foreCast: dto.foreCast,

      // 🚨 실시간 경기 상태 필드 (추후 실시간 연동 시 확장 지점)
      // exactOptionalPropertyTypes: true 설정으로 인해 
      // 데이터가 없는 필드는 명시적 undefined 할당 대신 생략함.
      defenders: [],
    };
  }

  /**
   * 🏆 toRanking: RankingRowDto를 RankingUIModel로 변환
   * Why: 순위 목록 UI에서 구단 메타데이터(엠블럼, 컬러)를 즉시 사용할 수 있도록 바인딩함.
   */
  static toRanking(dto: RankingRowDto): RankingUIModel {
    return {
      ...dto,
      meta: findTeamMeta(dto.teamCode) || findTeamMeta("DEFAULT"),
    };
  }

  /**
   * 🏟️ toTeamInfo: 구단 코드를 MatchTeamInfo로 변환
   * Why: 경기와 무관한 단순 팀 정보 표시(내 응원팀 등) 시에도 SSOT 메타데이터를 보장함.
   */
  static toTeamInfo(teamCode: string, teamName?: string): MatchTeamInfo {
    const meta = findTeamMeta(teamCode) || findTeamMeta("DEFAULT");
    return {
      code: teamCode,
      name: teamName || meta.name,
      meta,
    };
  }
}
