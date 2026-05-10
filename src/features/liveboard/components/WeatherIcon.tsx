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

interface WeatherIconProps {
  skyStatus: SkyStatus | null;
  rainType: RainType | null;
  size: number;
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
  size,
}: WeatherIconProps) {
  const key = resolveWeatherIconKey(skyStatus, rainType);
  const source = WEATHER_ICON_SOURCES[key];

  if (typeof source === "string") {
    return (
      <Text
        style={[styles.emoji, { fontSize: size, lineHeight: size * 1.1 }]}
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
      style={{ width: size, height: size }}
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
});
