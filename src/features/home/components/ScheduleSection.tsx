import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { CalendarGameDto, CalendarCellModel } from "../types";
import { styles } from "../styles";

export function ScheduleSection(props: { schedule: CalendarGameDto[] }) {
  const { schedule } = props;
  const days = useMemo(() => buildCalendarDays(schedule), [schedule]);

  return (
    <View style={[styles.section, styles.sectionBottomPad]}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitleText}>7월, 우리팀 경기 일정이에요</Text>
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
          {days.map((cell, idx) => (
            <TouchableOpacity
              key={`${cell.day}-${idx}`}
              activeOpacity={0.85}
              disabled={!cell.hasGame}
              accessibilityRole="button"
              accessibilityLabel={cell.hasGame ? `${cell.day}일 ${cell.opponentShort}전` : `${cell.day}일 경기 없음`}
              onPress={() =>
                router.push({
                  pathname: "/schedule",
                  params: { view: "day", day: cell.day }
                })
              }
              style={styles.calendarCell}
            >
              <View style={styles.calendarCellTopRow}>
                <Text style={styles.calendarDayText}>{cell.day}</Text>
                {cell.location ? (
                  <Text style={styles.calendarLocationText}>{cell.location}</Text>
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
          ))}
        </View>
      </View>
    </View>
  );
}

function buildCalendarDays(schedule: CalendarGameDto[]): CalendarCellModel[] {
  const MAX_CELLS = 35;
  const dayToGame = new Map<number, CalendarGameDto>();
  schedule.forEach((g) => dayToGame.set(g.day, g));

  return Array.from({ length: MAX_CELLS }, (_, idx) => {
    const day = idx + 1;
    const game = dayToGame.get(day);
    const base: CalendarCellModel = {
      day,
      hasGame: !!game,
      opponentShort: game?.opponentShort ?? "",
      isSelected: game?.isSelected === true,
    };

    if (game?.location) {
      base.location = game.location;
    }

    if (game?.timeText) {
      base.timeText = game.timeText;
    }

    return base;
  });
}
