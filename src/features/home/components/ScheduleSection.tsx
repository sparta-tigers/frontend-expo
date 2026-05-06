import { router } from "expo-router";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles";
import { CalendarCellModel, CalendarGameDto } from "../types";

export const ScheduleSection = React.memo(function ScheduleSection(props: { 
  schedule: CalendarGameDto[];
  year?: number;
  month?: number;
}) {
  const { schedule, year = 2026, month = 2 } = props; // 기본값: 2026년 3월 (month=2)
  const days = useMemo(() => buildCalendarDays(schedule, year, month), [schedule, year, month]);

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

function buildCalendarDays(
  schedule: CalendarGameDto[],
  year: number,
  month: number
): CalendarCellModel[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dayToGame = new Map<number, CalendarGameDto>();
  schedule.forEach((g) => dayToGame.set(g.day, g));

  const daysArray: CalendarCellModel[] = [];

  // 1. 월 시작 전 빈 셀 채우기
  for (let i = 0; i < firstDay; i++) {
    daysArray.push({
      day: 0, // 빈 셀 식별용
      hasGame: false,
      opponentShort: "",
      isSelected: false,
    });
  }

  // 2. 실제 날짜 채우기
  for (let d = 1; d <= daysInMonth; d++) {
    const game = dayToGame.get(d);
    const cell: CalendarCellModel = {
      day: d,
      hasGame: !!game,
      opponentShort: game?.opponentShort ?? "",
      isSelected: game?.isSelected === true,
      location: game?.location,
      timeText: game?.timeText,
    };
    daysArray.push(cell);
  }

  // 3. 5주(35칸) 또는 6주(42칸) 그리드 맞추기 (최소 35칸)
  const totalCells = Math.ceil(daysArray.length / 7) * 7;
  const finalTotal = Math.max(totalCells, 35);
  
  while (daysArray.length < finalTotal) {
    daysArray.push({
      day: 0,
      hasGame: false,
      opponentShort: "",
      isSelected: false,
    });
  }

  return daysArray;
}
