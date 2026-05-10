import { ForeCastDto, RainType } from "@/src/features/liveboard/types";

/**
 * 날씨 포맷터 유틸리티 (순수 함수)
 *
 * Why: NowCastCard / ForeCastTable 두 컴포넌트가 동일한 표시 규칙을 공유해야 하므로
 * 포맷팅 로직을 한 곳에 두고 null/undefined 처리 규칙을 단일 출처로 유지한다.
 */

/** 기온 — null이면 "--°", 아니면 `28.3°` 형식 */
export function formatTemperature(
  value: number | null | undefined,
  fractionDigits = 0,
): string {
  if (value == null || Number.isNaN(value)) return "--°";
  return `${value.toFixed(fractionDigits)}°`;
}

/** 기온(ForeCast용, °C 단위 붙이기) — null이면 "--" */
export function formatTemperatureCelsius(
  value: number | null | undefined,
): string {
  if (value == null || Number.isNaN(value)) return "--";
  return `${Math.round(value)}°C`;
}

/** 퍼센트 — null이면 "--%" */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "--%";
  return `${Math.round(value)}%`;
}

/** 강수량(mm) — null이면 0mm로 대체(Figma 디자인: 0mm 기본 노출) */
export function formatRainAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "0mm";
  return `${value}mm`;
}

/** 강수량(예보 셀용) — null이면 "--" */
export function formatRainAmountCell(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "--";
  return `${value}mm`;
}

/**
 * 풍향 16방위 → 한글 8방위 변환
 *
 * 백엔드 응답은 `"N" | "NNE" | ... | "NNW"` 16값.
 * Figma에서는 "동풍 2m/s"와 같이 8방위로 표기하므로 해상도를 낮춘다.
 */
function windDirectionToKorean(code: string): string {
  const map: Record<string, string> = {
    N: "북풍",
    NNE: "북풍",
    NE: "북동풍",
    ENE: "북동풍",
    E: "동풍",
    ESE: "동풍",
    SE: "남동풍",
    SSE: "남동풍",
    S: "남풍",
    SSW: "남풍",
    SW: "남서풍",
    WSW: "남서풍",
    W: "서풍",
    WNW: "서풍",
    NW: "북서풍",
    NNW: "북서풍",
  };
  return map[code] ?? "-";
}

/** 풍향·풍속 — 둘 중 하나라도 null이면 "-" */
export function formatWind(
  windDirection: string | null | undefined,
  windSpeed: number | null | undefined,
): string {
  if (windDirection == null || windSpeed == null || Number.isNaN(windSpeed)) {
    return "-";
  }
  const koDir = windDirectionToKorean(windDirection);
  return `${koDir} ${windSpeed}m/s`;
}

/** 강수형태 — NONE/null이면 "-", 그 외는 한글 description */
export function formatRainType(rainType: RainType | null | undefined): string {
  if (rainType == null || rainType === "NONE") return "-";
  const map: Record<Exclude<RainType, "NONE">, string> = {
    RAIN: "비",
    RAIN_SNOW: "비/눈",
    SNOW: "눈",
    RAINDROP: "빗방울",
    RAINDROP_SNOW_FLYING: "빗방울눈날림",
    SNOW_FLYING: "눈날림",
  };
  return map[rainType] ?? "-";
}

/** ISO `castTime`을 `HH:00` 형식으로 변환 (24시간제). 파싱 실패 시 "--:--" */
export function formatHour(castTime: string | null | undefined): string {
  if (!castTime) return "--:--";
  const date = new Date(castTime);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hh = String(date.getHours()).padStart(2, "0");
  return `${hh}:00`;
}

/**
 * 현재 시각 이후의 예보만 필터링하여 오름차순 정렬 후 상위 N개를 반환하는 순수 함수.
 *
 * @param foreCast 원본 예보 배열
 * @param now 기준 시각 (기본값: new Date())
 * @param limit 최대 반환 개수 (기본값: 5)
 */
export function filterUpcomingForeCast(
  foreCast: ForeCastDto[],
  now: Date = new Date(),
  limit = 5,
): ForeCastDto[] {
  if (!foreCast || foreCast.length === 0) return [];
  const nowMs = now.getTime();
  return foreCast
    .filter((item) => {
      if (!item.castTime) return false;
      const t = new Date(item.castTime).getTime();
      return !Number.isNaN(t) && t > nowMs;
    })
    .sort(
      (a, b) => new Date(a.castTime).getTime() - new Date(b.castTime).getTime(),
    )
    .slice(0, limit);
}
