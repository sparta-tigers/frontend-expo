import { apiClient } from "@/src/core/client";
import { LiveBoardRoomDto } from "./types";

/**
 * 특정 날짜의 라이브보드 방 목록 조회
 * @param anyday yyyyMMdd 형식의 날짜 문자열 (생략 시 오늘)
 */
export const fetchLiveBoardRooms = async (
  anyday?: string,
): Promise<LiveBoardRoomDto[]> => {
  return await apiClient.get<LiveBoardRoomDto[]>("/api/liveboard/room", {
    ...(anyday ? { anyday } : {}),
  });
};
