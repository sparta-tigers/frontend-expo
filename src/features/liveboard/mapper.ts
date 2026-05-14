// src/features/liveboard/mapper.ts
import { MatchRoomDto } from "@/src/shared/types/match";
import { LiveboardData } from "./types";

/**
 * LiveboardMapper
 * 
 * Why: API DTO와 UI 모델을 분리하여 'Zero Magic'을 실현함.
 * 백엔드 데이터 구조 변경 시 이 매퍼만 수정하면 UI 전체의 안정성을 보장할 수 있음.
 */
export const LiveboardMapper = {
  /**
   * toLiveboardData: API 응답 객체를 UI 전용 모델로 변환
   */
  toLiveboardData(room: MatchRoomDto): LiveboardData {
    return {
      matchId: room.matchId,
      liveBoardStatus: room.liveBoardStatus,
      nowCast: room.nowCast,
      foreCast: room.foreCast,
      connectCount: room.connectCount,
    };
  },
};
