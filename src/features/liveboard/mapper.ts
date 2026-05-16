// src/features/liveboard/mapper.ts
import { MatchRoomDto } from "@/src/shared/types/match";
import { LiveboardData, BroadcastItem, BroadcastType, InningTextsDto } from "./types";

/**
 * LiveboardMapper
 * 
 * Why: API DTO와 UI 모델을 분리하여 'Zero Magic'을 실현함.
 * 백엔드 문자열 배열을 구조화된 객체 배열로 정제하여 UI가 조건 없이 렌더링하도록 보장.
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
      homeScore: 0, // 초기값
      awayScore: 0,
      inning: 1,
      inningHalf: "초",
      defenders: [], // 실시간 데이터 수신 시 업데이트
      inningTexts: room.inningTexts ? this.parseInningTexts(room.inningTexts) : undefined,
    };
  },

  /**
   * parseInningTexts: Raw DTO의 문자열 배열을 구조화된 BroadcastItem으로 변환
   */
  parseInningTexts(dto: InningTextsDto): { [inning: number]: BroadcastItem[] } {
    const result: { [inning: number]: BroadcastItem[] } = {};

    const mapping: { [key in keyof InningTextsDto]: number } = {
      inningOneTexts: 1,
      inningTwoTexts: 2,
      inningThreeTexts: 3,
      inningFourTexts: 4,
      inningFiveTexts: 5,
      inningSixTexts: 6,
      inningSevenTexts: 7,
      inningEightTexts: 8,
      inningNineTexts: 9,
      inningExtraTexts: 10, // 연장은 10번 키로 관리
    };

    (Object.keys(mapping) as (keyof InningTextsDto)[]).forEach((key) => {
      const rawTexts = dto[key];
      if (!rawTexts) return;

      const inning = mapping[key] as number;
      
      // 🚨 Zero Magic: 매퍼 계층에서 모든 문자열 정제 및 타입 판별 완료
      result[inning] = rawTexts.map((text, index) => {
        const cleanedText = text.replace(/^-\s*/, "").trim();
        let type: BroadcastType = "PLAY_RESULT";

        if (cleanedText.includes("타자")) {
          type = "BATTER_INFO";
        } else if (text.startsWith("-")) {
          type = "PITCH_LOG";
        } else if (cleanedText.includes("회") && (cleanedText.includes("초") || cleanedText.includes("말"))) {
          type = "INNING_INFO";
        }

        return {
          id: `${inning}-${index}`,
          type,
          text: cleanedText,
        };
      });
    });

    return result;
  },
};
