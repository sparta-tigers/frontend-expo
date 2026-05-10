import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import { WeatherIcon } from "@/src/features/liveboard/components/WeatherIcon";
import { NowCastDto } from "@/src/features/liveboard/types";
import {
    formatPercent,
    formatRainAmount,
    formatTemperature,
    formatWind,
} from "@/src/features/liveboard/utils/weatherFormat";
import { theme } from "@/src/styles/theme";

interface NowCastCardProps {
  stadiumName: string | null;
  nowCast: NowCastDto | null;
}

/**
 * 현재 날씨 카드
 *
 * Why: Figma 기획안 상단 섹션 — 구장명 / 큰 기온 / 날씨 아이콘 / 강수확률·강수량·풍향풍속 3행 지표.
 * - `nowCast === null` 이면 Empty State 렌더링.
 * - 각 지표 null은 formatter가 "-"/"--" 기본값으로 대체.
 */
export const NowCastCard = React.memo(function NowCastCard({
  stadiumName,
  nowCast,
}: NowCastCardProps) {
  if (!nowCast) {
    return (
      <Box style={styles.card} align="center" justify="center" py="xxxxl">
        <MaterialIcons
          name="cloud-off"
          size={36}
          color={theme.colors.text.tertiary}
        />
        <Typography
          variant="body1"
          color="text.secondary"
          weight="medium"
          mt="sm"
        >
          현재 날씨 정보를 불러오지 못했어요
        </Typography>
      </Box>
    );
  }

  const tempText = formatTemperature(nowCast.temperature, 1); // 28.3°
  const popText = formatPercent(nowCast.rainProbability); // 0%
  const rainText = formatRainAmount(nowCast.rainAmount); // 0mm
  const windText = formatWind(nowCast.windDirection, nowCast.windSpeed); // 동풍 2m/s

  return (
    <Box style={styles.card}>
      {/* 구장명 (위치 핀 + 민트 텍스트) */}
      <View style={styles.stadiumRow}>
        <MaterialIcons
          name="location-on"
          size={14}
          color={theme.colors.brand.mint}
        />
        <Typography
          style={styles.stadiumText}
          weight="medium"
          accessibilityLabel={`구장 ${stadiumName ?? "미지정"}`}
        >
          {stadiumName ?? "-"}
        </Typography>
      </View>

      {/* 메인 블록: 좌측 기온 + 우측 아이콘 */}
      <View style={styles.mainRow}>
        <View style={styles.tempBox}>
          <Typography
            style={styles.tempText}
            weight="bold"
            accessibilityLabel={`현재 기온 ${tempText}`}
          >
            {tempText}
          </Typography>
        </View>

        <View style={styles.iconBox}>
          <WeatherIcon
            skyStatus={nowCast.skyStatus}
            rainType={nowCast.rainType}
            size={ICON_SIZE}
          />
        </View>
      </View>

      {/* 3행 지표: 강수확률 / 강수량 / 풍향·풍속 */}
      <View style={styles.metricsBlock}>
        <MetricRow
          iconName="umbrella"
          label="강수확률"
          value={popText}
          accessibilityLabel={`강수확률 ${popText}`}
        />
        <MetricRow
          iconName="water-drop"
          label="강수량"
          value={rainText}
          accessibilityLabel={`강수량 ${rainText}`}
        />
        <MetricRow
          iconName="air"
          label="풍향 풍속"
          value={windText}
          accessibilityLabel={windText === "-" ? "풍향 정보 없음" : windText}
        />
      </View>
    </Box>
  );
});

// ========================================================
// 내부: 지표 행
// ========================================================

type IconName = "umbrella" | "water-drop" | "air";

function MetricRow({
  iconName,
  label,
  value,
  accessibilityLabel,
}: {
  iconName: IconName;
  label: string;
  value: string;
  accessibilityLabel: string;
}) {
  return (
    <View
      style={styles.metricRow}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialIcons
        name={iconName}
        size={16}
        color={theme.colors.text.secondary}
        accessibilityLabel={label}
      />
      <Typography style={styles.metricValue} weight="regular">
        {value}
      </Typography>
    </View>
  );
}

// ========================================================
// Styles
// ========================================================

const ICON_SIZE = 110;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 30,
    paddingTop: 18,
    paddingBottom: 22,
  },
  stadiumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stadiumText: {
    fontSize: 13,
    color: theme.colors.brand.mint,
    letterSpacing: -0.3,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  tempBox: {
    flexShrink: 1,
  },
  tempText: {
    fontSize: 64,
    color: theme.colors.text.primary,
    lineHeight: 72,
    letterSpacing: -2,
  },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  metricsBlock: {
    marginTop: 4,
    gap: 6,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricValue: {
    fontSize: 13,
    color: theme.colors.text.primary,
  },
});
