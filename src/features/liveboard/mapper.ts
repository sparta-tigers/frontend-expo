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
    const live = room.liveBoardData;
    const score = live?.matchScore;
    const players = live?.players || [];

    // 수비수/타자 분리 매핑
    const defenders = players
      .filter((p) => !p.role.includes("batter") && !p.role.includes("runner") && p.role !== "supervision")
      .map((p) => ({ name: p.name, role: p.role, x: 0, y: 0 }));

    const batter = players.find((p) => p.role === "batter");
    const runner1 = players.find((p) => p.role === "runner1");
    const runner2 = players.find((p) => p.role === "runner2");
    const runner3 = players.find((p) => p.role === "runner3");

    const inningTexts = room.inningTexts ? this.parseInningTexts(room.inningTexts) : undefined;
    
    // 가장 최근 이벤트 추출 (현재 이닝의 가장 마지막 유의미한 텍스트)
    const currentInningNum = live?.currentInning ? parseInt(live.currentInning.replace(/[^0-9]/g, "")) : 1;
    const currentInningTexts = inningTexts?.[currentInningNum] || [];
    
    // 🚨 [Phase 45] 무의미한 구분선(----) 및 빈 문자열 원천 차단
    const validInningTexts = currentInningTexts.filter(t => {
      const trimmed = t.text.trim();
      if (trimmed.length === 0) return false;
      // 대시(-), 등호(=), 언더바(_)로만 이루어진 문자열 제거
      const onlySeparators = trimmed.replace(/[-=_]/g, "").length === 0;
      return !onlySeparators;
    });
    
    const lastEvent = validInningTexts.length > 0 
      ? validInningTexts[validInningTexts.length - 1].text 
      : null;

    return {
      matchId: room.matchId,
      liveBoardStatus: room.liveBoardStatus,
      nowCast: room.nowCast,
      foreCast: room.foreCast,
      connectCount: room.connectCount,
      homeScore: score ? parseInt(score.homeScore || "0") : 0,
      awayScore: score ? parseInt(score.awayScore || "0") : 0,
      inning: currentInningNum,
      inningHalf: live?.currentInning?.includes("초") ? "초" : "말",
      ballCount: score?.ball || 0,
      strikeCount: score?.strike || 0,
      outCount: score?.out || 0,
      pitcherName: players.find((p) => p.role === "pitcher")?.name || "-",
      pitchCount: score ? parseInt(score.pitcherCount || "0") : 0,
      lastEvent,
      defenders,
      batter: batter ? { name: batter.name, role: "batter", x: 0, y: 0 } : null,
      runner1: runner1 ? { name: runner1.name, role: "runner1", x: 0, y: 0 } : null,
      runner2: runner2 ? { name: runner2.name, role: "runner2", x: 0, y: 0 } : null,
      runner3: runner3 ? { name: runner3.name, role: "runner3", x: 0, y: 0 } : null,
      inningTexts,
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
      result[inning] = rawTexts
        .filter((text) => !text.startsWith("---")) // 구분선 데이터 필터링
        .map((text, index) => {
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
