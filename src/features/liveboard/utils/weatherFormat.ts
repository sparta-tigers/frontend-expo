import { ForeCastDto, RainType } from "@/src/features/liveboard/types";

/**
 * 날씨 포맷터 유틸리티 (순수 함수)
 *
 * Why: NowCastCard / ForeCastTable 두 컴포넌트가 동일한 표시 규칙을 공유해야 하므로
 * 포맷팅 로직을 한 곳에 두고 null/undefined 처리 규칙을 단일 출처로 유지한다.
 */

/**
 * 기온 포맷팅 (단위 포함)
 *
 * Why: 소수점 자릿수를 유연하게 조절하면서도, 데이터 부재 시 일관된 placeholder("--°")를
 * 제공하여 UI의 레이아웃 깨짐을 방지한다.
 */
export function formatTemperature(
  value: number | null | undefined,
  fractionDigits = 0,
): string {
  if (value == null || Number.isNaN(value)) return "--°";
  return `${value.toFixed(fractionDigits)}°`;
}

/**
 * 기온 포맷팅 (정수형 Celsius)
 *
 * Why: 예보 테이블처럼 좁은 공간에서는 반올림된 정수와 "°C" 단위를 사용하여
 * 정보 밀도를 높이고 시독성을 확보한다.
 */
export function formatTemperatureCelsius(
  value: number | null | undefined,
): string {
  if (value == null || Number.isNaN(value)) return "--";
  return `${Math.round(value)}°C`;
}

/**
 * 퍼센트 포맷팅
 *
 * Why: 강수확률 등 0~100 범위의 지표를 소수점 없이 정수로 일관되게 표현한다.
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "--%";
  return `${Math.round(value)}%`;
}

/**
 * 강수량 포맷팅 (mm)
 *
 * Why: NowCastCard에서는 강수량이 없을 경우 "0mm"를 명시적으로 노출하여
 * 사용자에게 강수 없음 상태를 확신시키는 디자인 정책을 따른다.
 */
export function formatRainAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "0mm";
  return `${value}mm`;
}

/**
 * 강수량 포맷팅 (예보 테이블 셀용)
 *
 * Why: 테이블 내부에서는 정보 과부하를 막기 위해 데이터가 없는 경우
 * "0mm" 대신 placeholder("--")를 사용하여 유효 데이터만 강조한다.
 */
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

/**
 * 풍향·풍속 결합 포맷팅
 *
 * Why: 두 지표를 하나의 문자열로 결합하여 텍스트 영역을 절약한다.
 * 원시 데이터 해상도를 8방위로 낮추어 일반 사용자가 직관적으로 이해하도록 돕는다.
 */
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

/**
 * 강수형태 코드 변환
 *
 * Why: 백엔드 Enum 코드를 사용자 친화적인 한글 설명으로 매핑한다.
 * NONE 상태를 명시적으로 "-"로 처리하여 불필요한 텍스트 노출을 줄인다.
 */
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

/**
 * 예보 시간 포맷팅 (HH:00)
 *
 * Why: ISO 문자열에서 시간 정보만 추출하여 24시간제 정시(00분) 기준으로 표시한다.
 * 테이블의 수평 공간을 효율적으로 사용하기 위한 정적 포맷이다.
 */
export function formatHour(castTime: string | null | undefined): string {
  if (!castTime) return "--:--";
  const date = new Date(castTime);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hh = String(date.getHours()).padStart(2, "0");
  return `${hh}:00`;
}

/**
 * 미래 시점 예보 필터링 및 정렬
 *
 * Why: 과거 데이터가 섞인 원본 예보 배열에서 현재 시각 이후의 유효한 데이터만 추출하여
 * 사용자에게 '살아있는' 정보만을 전달한다. limit를 통해 UI 테이블의 가로 폭(정보량)을 제어한다.
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
