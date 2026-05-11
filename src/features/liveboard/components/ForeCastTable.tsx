import React from "react";
import { StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui/typography";
import { WeatherIcon } from "@/src/features/liveboard/components/WeatherIcon";
import { ForeCastDto } from "@/src/features/liveboard/types";
import {
    formatHour,
    formatPercent,
    formatRainAmountCell,
    formatRainType,
    formatTemperatureCelsius,
} from "@/src/features/liveboard/utils/weatherFormat";
import { theme } from "@/src/styles/theme";

interface ForeCastTableProps {
  /** 이미 현재 시각 이후 + 상위 N개로 필터링된 예보 배열 */
  foreCast: ForeCastDto[];
}

/**
 * 시간대별 예보 테이블
 *
 * Why: Figma 기획안 하단 섹션 — 좌측 세로 라벨(시간/하늘/기온/강수확률/강수형태/강수량) +
 * 우측 가로 최대 5컬럼의 예보 데이터.
 * - 빈 배열이면 Empty State.
 * - 컬럼 수는 foreCast.length만큼 렌더.
 */
export const ForeCastTable = React.memo(function ForeCastTable({
  foreCast,
}: ForeCastTableProps) {
  if (!foreCast || foreCast.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Typography
          variant="body2"
          color="text.secondary"
          weight="medium"
          center
        >
          남은 예보가 없습니다
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* 좌측 라벨 컬럼 */}
      <View style={styles.labelCol}>
        <LabelCell text="시간" />
        <LabelCell text="하늘" isIconRow />
        <LabelCell text="기온" />
        <LabelCell text="강수확률" />
        <LabelCell text="강수형태" />
        <LabelCell text="강수량" />
      </View>

      {/* 우측 데이터 영역 */}
      <View style={styles.dataArea}>
        {foreCast.map((item, idx) => (
          <ForeCastColumn key={`${item.castTime}-${idx}`} item={item} />
        ))}
      </View>
    </View>
  );
});

// ========================================================
// 내부 컴포넌트
// ========================================================

function LabelCell({
  text,
  isIconRow = false,
}: {
  text: string;
  isIconRow?: boolean;
}) {
  return (
    <View style={[styles.labelCell, isIconRow ? styles.rowIcon : styles.rowDefault]}>
      <Typography style={styles.labelText} weight="regular">
        {text}
      </Typography>
    </View>
  );
}

function ForeCastColumn({ item }: { item: ForeCastDto }) {
  return (
    <View style={styles.column}>
      {/* 시간 (민트 pill) */}
      <View style={[styles.cell, styles.rowDefault]}>
        <View style={styles.hourPill}>
          <Typography style={styles.hourText} weight="semibold">
            {formatHour(item.castTime)}
          </Typography>
        </View>
      </View>

      {/* 하늘 아이콘 */}
      <View style={[styles.cell, styles.rowIcon]}>
        <WeatherIcon
          skyStatus={item.skyStatus}
          rainType={item.rainType}
          size="md"
        />
      </View>

      {/* 기온 (하단 hairline 포함) */}
      <View style={[styles.cell, styles.cellWithDivider, styles.rowDefault]}>
        <Typography style={styles.valueText} weight="regular">
          {formatTemperatureCelsius(item.temperature)}
        </Typography>
      </View>

      {/* 강수확률 */}
      <View style={[styles.cell, styles.rowDefault]}>
        <Typography style={styles.valueText} weight="regular">
          {formatPercent(item.rainProbability)}
        </Typography>
      </View>

      {/* 강수형태 */}
      <View style={[styles.cell, styles.rowDefault]}>
        <Typography style={styles.valueText} weight="regular">
          {formatRainType(item.rainType)}
        </Typography>
      </View>

      {/* 강수량 */}
      <View style={[styles.cell, styles.rowDefault]}>
        <Typography style={styles.valueText} weight="regular">
          {formatRainAmountCell(item.rainAmount)}
        </Typography>
      </View>
    </View>
  );
}

// ========================================================
// Styles
// ========================================================

const ROW_HEIGHT = 28;
const ROW_HEIGHT_ICON = 40;
const LABEL_WIDTH = 60;
const COLUMN_MIN_WIDTH = 56;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    marginTop: 10,
    marginHorizontal: 14,
    marginBottom: 30,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    ...theme.shadow.card,
  },
  labelCol: {
    width: LABEL_WIDTH,
    justifyContent: "center",
  },
  labelCell: {
    paddingLeft: 10,
    justifyContent: "center",
  },
  labelText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  dataArea: {
    flex: 1,
    flexDirection: "row",
  },
  column: {
    flex: 1,
    minWidth: COLUMN_MIN_WIDTH,
    alignItems: "center",
  },
  cell: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cellWithDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.team.neutralLight,
    marginHorizontal: 6,
    width: "85%",
  },
  hourPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.brand.mint,
    backgroundColor: theme.colors.background,
  },
  hourText: {
    fontSize: 11,
    color: theme.colors.brand.mint,
  },
  valueText: {
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  rowDefault: {
    height: ROW_HEIGHT,
  },
  rowIcon: {
    height: ROW_HEIGHT_ICON,
  },
  emptyCard: {
    marginTop: 20,
    marginHorizontal: 14,
    paddingVertical: 40,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
});
