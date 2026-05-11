// app/(tabs)/liveboard/useLiveboard.ts
import { fetchLiveBoardRooms } from "@/src/features/liveboard/api";
import {
  LiveBoardRoomDto,
  RainType,
  SkyStatus,
} from "@/src/features/liveboard/types";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

// ── 날씨 아이콘/텍스트 매핑 ──────────────────────────────
type WeatherIconName = keyof typeof MaterialIcons.glyphMap;

export interface WeatherDisplay {
  text: string;
  icon: WeatherIconName;
}

export function getWeatherDisplay(
  skyStatus: SkyStatus | null | undefined,
  rainType: RainType | null | undefined,
): WeatherDisplay {
  if (rainType && rainType !== "NONE") {
    switch (rainType) {
      case "RAIN":
      case "RAINDROP":
        return { text: "비", icon: "umbrella" };
      case "RAIN_SNOW":
      case "RAINDROP_SNOW_FLYING":
        return { text: "비/눈", icon: "ac-unit" };
      case "SNOW":
      case "SNOW_FLYING":
        return { text: "눈", icon: "ac-unit" };
    }
  }
  switch (skyStatus) {
    case "SUNNY":
      return { text: "맑음", icon: "wb-sunny" };
    case "CLOUDY_PARTLY":
      return { text: "구름많음", icon: "wb-cloudy" };
    case "CLOUDY":
      return { text: "흐림", icon: "cloud" };
    default:
      return { text: "맑음", icon: "wb-sunny" };
  }
}

// ── 주간 날짜 계산 유틸 ──────────────────────────────────
export interface WeekDayDto {
  dayOfWeek: string;
  date: number;
  fullDate: Date;
  hasGame: boolean;
  anydayKey: string;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function toAnydayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function getWeekStartDate(baseDate: Date, weekOffset: number): Date {
  const d = new Date(baseDate);
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeekDays(weekStart: Date, rooms: LiveBoardRoomDto[]): WeekDayDto[] {
  const gameDays = new Set(
    rooms.map((r) => toAnydayKey(new Date(r.matchTime))),
  );
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = toAnydayKey(d);
    return {
      dayOfWeek: DAY_LABELS[d.getDay()],
      date: d.getDate(),
      fullDate: d,
      hasGame: gameDays.has(key),
      anydayKey: key,
    };
  });
}

function formatWeekLabel(weekStart: Date): string {
  const year = weekStart.getFullYear();
  const month = weekStart.getMonth() + 1;
  const weekOfMonth = Math.ceil(weekStart.getDate() / 7);
  const weekLabels = ["첫째", "둘째", "셋째", "넷째", "다섯째"];
  return `${year}년 ${month}월 ${weekLabels[weekOfMonth - 1] ?? weekOfMonth + "번째"} 주`;
}

// ── 훅 ──────────────────────────────────────────────────
interface UseLiveboardReturn {
  weekOffset: number;
  setWeekOffset: (fn: (prev: number) => number) => void;
  selectedAnyday: string;
  setSelectedAnyday: (key: string) => void;
  weekDays: WeekDayDto[];
  weekLabel: string;
  selectedDay: WeekDayDto | undefined;
  selectedDayRooms: LiveBoardRoomDto[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * useLiveboard
 *
 * Why: 라이브보드 탭의 주간 캘린더·날짜 선택·경기 목록 조회 로직을 UI로부터 분리.
 */
export function useLiveboard(): UseLiveboardReturn {
  const today = useMemo(() => new Date(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedAnyday, setSelectedAnyday] = useState<string>(
    toAnydayKey(today),
  );

  const weekStart = useMemo(
    () => getWeekStartDate(today, weekOffset),
    [today, weekOffset],
  );

  const weekAnydayKeys = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return toAnydayKey(d);
      }),
    [weekStart],
  );

  // 주간 hasGame 도트를 위한 7일치 병렬 조회
  const { data: weekRoomsMap = {} } = useQuery({
    queryKey: ["liveboard", "week", weekAnydayKeys[0]],
    queryFn: async () => {
      const results = await Promise.all(
        weekAnydayKeys.map((key) =>
          fetchLiveBoardRooms(key).then((rooms) => ({ key, rooms })),
        ),
      );
      return Object.fromEntries(results.map(({ key, rooms }) => [key, rooms]));
    },
    staleTime: 60_000,
  });

  const allWeekRooms = useMemo(
    () => Object.values(weekRoomsMap).flat(),
    [weekRoomsMap],
  );

  const weekDays = useMemo(
    () => buildWeekDays(weekStart, allWeekRooms),
    [weekStart, allWeekRooms],
  );

  const weekLabel = useMemo(() => formatWeekLabel(weekStart), [weekStart]);
  const selectedDay = weekDays.find((d) => d.anydayKey === selectedAnyday);

  // 주 이동 시 선택 날짜 자동 보정
  React.useEffect(() => {
    if (!weekAnydayKeys.includes(selectedAnyday)) {
      setSelectedAnyday(weekAnydayKeys[0]);
    }
  }, [weekAnydayKeys, selectedAnyday]);

  const {
    data: selectedDayRooms = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["liveboard", "rooms", selectedAnyday],
    queryFn: () => fetchLiveBoardRooms(selectedAnyday),
    staleTime: 60_000,
  });

  return {
    weekOffset,
    setWeekOffset,
    selectedAnyday,
    setSelectedAnyday,
    weekDays,
    weekLabel,
    selectedDay,
    selectedDayRooms,
    isLoading,
    isError,
    refetch,
  };
}
