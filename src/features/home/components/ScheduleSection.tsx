import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles";
import { CalendarGameDto } from "../types";
import { useCalendarGrid } from "@/src/shared/hooks/useCalendarGrid";

export const ScheduleSection = React.memo(function ScheduleSection(props: { 
  schedule: CalendarGameDto[];
  year?: number;
  month?: number;
}) {
  const { schedule, year = 2026, month = 2 } = props; // 기본값: 2026년 3월 (month=2)
  const days = useCalendarGrid(year, month, schedule);

  return (
    <View style={[styles.section, styles.sectionBottomPad]}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitleText}>{month + 1}월, 우리팀 경기 일정이에요</Text>
      </View>

      <View style={styles.calendarWrap}>
        <View style={styles.calendarHeader}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <View key={d} style={styles.calendarHeaderCell}>
              <Text
                style={[
                  styles.calendarHeaderText,
                  (d === "일" || d === "토") && styles.calendarHeaderTextAccent,
                ]}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days.map((cell, idx) => {
            if (cell.day === 0) {
              return (
                <View 
                  key={`empty-${idx}`} 
                  style={styles.calendarCell}
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden
                />
              );
            }

            return (
              <TouchableOpacity
                key={`${cell.day}-${idx}`}
                activeOpacity={0.85}
                disabled={!cell.hasGame}
                accessibilityRole="button"
                accessibilityLabel={
                  cell.hasGame
                    ? `${cell.day}일 ${cell.opponentShort}전`
                    : `${cell.day}일 경기 없음`
                }
                onPress={() =>
                  router.push({
                    pathname: "/schedule",
                    params: { 
                      view: "day", 
                      day: cell.day.toString(),
                      year: year.toString(),
                      month: month.toString(),
                    },
                  })
                }
                style={styles.calendarCell}
              >
                <View style={styles.calendarCellTopRow}>
                  {cell.day > 0 && <Text style={styles.calendarDayText}>{cell.day}</Text>}
                  {cell.day > 0 && cell.location ? (
                    <Text style={styles.calendarLocationText}>
                      {cell.location}
                    </Text>
                  ) : (
                    <View style={styles.calendarLocationSpacer} />
                  )}
                </View>

                {cell.hasGame ? (
                  <View
                    style={[
                      styles.calendarOpponentBadge,
                      cell.isSelected && styles.calendarOpponentBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarOpponentText,
                        cell.isSelected && styles.calendarOpponentTextSelected,
                      ]}
                    >
                      {cell.opponentShort}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.calendarEmptySpacer} />
                )}

                {cell.timeText ? (
                  <Text style={styles.calendarTimeText}>{cell.timeText}</Text>
                ) : (
                  <View style={styles.calendarTimeSpacer} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
});

