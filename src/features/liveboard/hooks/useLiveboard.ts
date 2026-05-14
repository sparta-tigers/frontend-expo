import { fetchLiveBoardRooms } from "@/src/features/liveboard/api";
import {
  LiveBoardRoomDto,
  RainType,
  SkyStatus,
} from "@/src/features/liveboard/types";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { matchKeys } from "@/src/features/match/queries";

// ── 날씨 아이콘/텍스트 매핑 ──────────────────────────────
type WeatherIconName = keyof typeof MaterialIcons.glyphMap;

/**
 * WeatherDisplay
 * Why: API의 날씨 코드를 UI에서 직접 사용 가능한 텍스트와 아이콘 쌍으로 정규화한 형태.
 */
export interface WeatherDisplay {
  text: string;
  icon: WeatherIconName;
}

/**
 * 날씨 상태 코드 기반 UI 데이터 변환
 * Why: 기상청 기반의 복잡한 하늘상태(Sky)와 강수형태(Rain) 조합을 
 *      사용자 친화적인 '비/눈/맑음' 등의 단어와 Material 아이콘으로 매핑하기 위함.
 */
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

/**
 * WeekDayDto
 * Why: 주간 캘린더의 각 날짜 칸을 그리는 데 필요한 정보 집합.
 *      anydayKey(YYYYMMDD)는 API 요청과 데이터 매핑의 고유 키로 활용됨.
 */
export interface WeekDayDto {
  dayOfWeek: string;
  date: number;
  fullDate: Date;
  hasGame: boolean;
  anydayKey: string;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * Date 객체를 YYYYMMDD 문자열로 변환
 * Why: 백엔드 API가 기대하는 날짜 형식과 프론트엔드 캐시 키를 일치시키기 위함.
 */
export function toAnydayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * 특정 날짜와 주 오프셋 기준의 주 시작일(월요일) 계산
 * Why: 일요일(0) 시작이 아닌 월요일(1) 시작 달력을 기준으로 주간 데이터를 조회하기 위함.
 */
function getWeekStartDate(baseDate: Date, weekOffset: number): Date {
  const d = new Date(baseDate);
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 주간 날짜 목록(WeekDayDto[]) 생성
 * Why: 7일간의 날짜 객체를 생성하고, 조회된 경기 정보와 대조하여 
 *      캘린더에 '경기 있음' 도트를 표시할지 결정함.
 */
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

/**
 * 주차 레이블 포맷팅 (예: 2024년 5월 둘째 주)
 * Why: 사용자가 현재 보고 있는 주간 범위가 어디인지 직관적인 텍스트로 제공하기 위함.
 */
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
  const {
    data: weekRoomsMap = {},
    isError: isWeekError,
    refetch: refetchWeek,
  } = useQuery({
    queryKey: matchKeys.liveboard.week(weekAnydayKeys[0]),
    queryFn: async () => {
      // Promise.allSettled를 사용하여 일부 날짜 조회 실패가 
      // 전체 주간 달력 로드 실패로 이어지지 않도록 격리(Isolate).
      const results = await Promise.allSettled(
        weekAnydayKeys.map(async (key) => ({
          key,
          rooms: await fetchLiveBoardRooms(key),
        })),
      );
      return Object.fromEntries(
        results.flatMap((result) =>
          result.status === "fulfilled"
            ? [[result.value.key, result.value.rooms]]
            : [],
        ),
      );
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
    isError: isSelectedDayError,
    refetch: refetchSelectedDay,
  } = useQuery({
    queryKey: matchKeys.liveboard.rooms(selectedAnyday),
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
    isError: isWeekError || isSelectedDayError,
    refetch: () => {
      return Promise.all([refetchWeek(), refetchSelectedDay()]);
    },
  };
}
