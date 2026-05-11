import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text } from "react-native";

import { RainType, SkyStatus } from "@/src/features/liveboard/types";

/**
 * 날씨 아이콘 식별 키
 *
 * Why: (SkyStatus, RainType) 조합의 수많은 경우를 6개의 대표 아이콘으로 투영하여
 * 매핑 테이블을 단순하게 유지한다. 추후 아이콘이 세분화되면 키를 추가하기만 하면 됨.
 */
export type WeatherIconKey =
  | "sunny"
  | "cloudyPartly"
  | "cloudy"
  | "rain"
  | "snow"
  | "rainSnow";

/**
 * 날씨 아이콘 매핑 테이블 (단일 교체 지점)
 *
 * Why: 1차 구현에서는 이모지 문자열로 렌더링하고, 추후 디자이너의 이미지 에셋이
 * 확보되면 각 키의 값을 `require('@/assets/images/weather/sunny.png')` 등으로
 * 한 줄씩 교체하면 자동으로 <Image> 렌더 분기로 넘어간다.
 *
 * TODO: replace with asset (각 키별로 디자이너 에셋 확정 후 교체)
 */
export const WEATHER_ICON_SOURCES: Record<
  WeatherIconKey,
  string | ImageSourcePropType
> = {
  sunny: "☀️", // TODO: replace with asset
  cloudyPartly: "⛅", // TODO: replace with asset
  cloudy: "☁️", // TODO: replace with asset
  rain: "🌧️", // TODO: replace with asset
  snow: "❄️", // TODO: replace with asset
  rainSnow: "🌨️", // TODO: replace with asset
};

/**
 * (SkyStatus, RainType) 조합을 단일 WeatherIconKey로 결정론적 변환
 *
 * 규칙:
 * - 강수(rainType !== "NONE" && rainType !== null)가 있으면 강수형태 우선
 *   - SNOW / SNOW_FLYING → "snow"
 *   - RAIN_SNOW / RAINDROP_SNOW_FLYING → "rainSnow"
 *   - RAIN / RAINDROP / 그 외 → "rain"
 * - 강수가 없으면 하늘상태로 분기
 *   - CLOUDY → "cloudy"
 *   - CLOUDY_PARTLY → "cloudyPartly"
 *   - SUNNY / null → "sunny"
 */
export function resolveWeatherIconKey(
  skyStatus: SkyStatus | null,
  rainType: RainType | null,
): WeatherIconKey {
  if (rainType && rainType !== "NONE") {
    if (rainType === "SNOW" || rainType === "SNOW_FLYING") return "snow";
    if (rainType === "RAIN_SNOW" || rainType === "RAINDROP_SNOW_FLYING")
      return "rainSnow";
    return "rain";
  }
  if (skyStatus === "CLOUDY") return "cloudy";
  if (skyStatus === "CLOUDY_PARTLY") return "cloudyPartly";
  return "sunny";
}

/** 날씨 아이콘 크기 타입 */
export type WeatherIconSize = "sm" | "md" | "lg" | "xl";

/**
 * 아이콘 크기 수치 정의
 *
 * Why: Figma 기획안의 주요 사용처별 크기를 상수로 관리.
 * - sm: 라이브보드 목록 (15px)
 * - md: 시간대별 예보 테이블 (32px)
 * - lg: 구장날씨 상세 카드 등 (예비)
 */
const ICON_SIZE_VALS: Record<WeatherIconSize, number> = {
  sm: 15,
  md: 32,
  lg: 48,
  xl: 110,
};

interface WeatherIconProps {
  skyStatus: SkyStatus | null;
  rainType: RainType | null;
  /** 아이콘 크기 variant (sm | md | lg) */
  size?: WeatherIconSize;
}

/**
 * 날씨 아이콘 컴포넌트
 *
 * - 매핑 테이블 값이 string(이모지)이면 <Text>로 렌더
 * - 매핑 테이블 값이 number/ImageSourcePropType(에셋)이면 <Image>로 렌더
 *
 * Why: 에셋 교체 시 본 컴포넌트를 수정할 필요 없이 매핑 테이블만 바꿔도
 * 자연스럽게 <Image> 분기로 전환되도록 설계.
 */
export const WeatherIcon = React.memo(function WeatherIcon({
  skyStatus,
  rainType,
  size = "md",
}: WeatherIconProps) {
  const key = resolveWeatherIconKey(skyStatus, rainType);
  const source = WEATHER_ICON_SOURCES[key];

  // variant에 해당하는 스타일 선택 (인라인 스타일 제거)
  const sizeStyle = styles[size];

  if (typeof source === "string") {
    return (
      <Text
        style={[styles.emoji, sizeStyle]}
        accessibilityRole="image"
        accessibilityLabel={`날씨 아이콘: ${key}`}
      >
        {source}
      </Text>
    );
  }

  return (
    <Image
      source={source}
      style={sizeStyle}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={`날씨 아이콘: ${key}`}
    />
  );
});

const styles = StyleSheet.create({
  emoji: {
    textAlign: "center",
  },
  sm: {
    fontSize: ICON_SIZE_VALS.sm,
    lineHeight: ICON_SIZE_VALS.sm * 1.1,
    width: ICON_SIZE_VALS.sm,
    height: ICON_SIZE_VALS.sm,
  },
  md: {
    fontSize: ICON_SIZE_VALS.md,
    lineHeight: ICON_SIZE_VALS.md * 1.1,
    width: ICON_SIZE_VALS.md,
    height: ICON_SIZE_VALS.md,
  },
  lg: {
    fontSize: ICON_SIZE_VALS.lg,
    lineHeight: ICON_SIZE_VALS.lg * 1.1,
    width: ICON_SIZE_VALS.lg,
    height: ICON_SIZE_VALS.lg,
  },
  xl: {
    fontSize: ICON_SIZE_VALS.xl,
    lineHeight: ICON_SIZE_VALS.xl * 1.1,
    width: ICON_SIZE_VALS.xl,
    height: ICON_SIZE_VALS.xl,
  },
});
