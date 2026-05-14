/**
 * 날씨 도메인 공통 규격
 * 
 * Why: 기상청 API 응답 기반의 날씨 정보는 여러 도메인(Match, Liveboard)에서 
 * 공통으로 소비되므로 shared에서 통합 관리함.
 */

export type SkyStatus = "SUNNY" | "CLOUDY_PARTLY" | "CLOUDY";

export type RainType =
  | "NONE"
  | "RAIN"
  | "RAIN_SNOW"
  | "SNOW"
  | "RAINDROP"
  | "RAINDROP_SNOW_FLYING"
  | "SNOW_FLYING";

export type WeatherApiStatus =
  | "SUCCESS"
  | "NO_DATA"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

/**
 * 실시간 초단기 실황 데이터 (NowCast)
 */
export interface NowCastDto {
  referenceTime: string;
  stadium: string;
  temperature: number | null;
  skyStatus: SkyStatus | null;
  rainType: RainType | null;
  rainAmount: number | null;
  /** 강수확률(POP, 0~100) */
  rainProbability: number | null;
  windSpeed: number | null;
  windDirection: string | null;
}

/**
 * 시간대별 단기 예보 데이터 (ForeCast)
 */
export interface ForeCastDto {
  castTime: string;
  stadium: string;
  temperature: number | null;
  skyStatus: SkyStatus | null;
  rainProbability: number | null;
  rainType: RainType | null;
  rainAmount: number | null;
}
