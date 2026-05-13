import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import React, { useMemo } from "react";
import {
    Alert,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Box, Typography, List } from "@/components/ui";
import { useTicketAlarms, useTicketAlarmMutation } from "@/src/features/ticket-alarm/hooks/useTicketAlarm";
import { TicketAlarm } from "@/src/features/ticket-alarm/types";

/**
 * 📅 formatDate: 날짜와 요일을 한국어로 포맷팅합니다 (date-fns 대체)
 */
const formatDate = (dateStr: string, includeYear = true) => {
  const date = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return includeYear 
    ? `${year}년 ${month}월 ${day}일(${dayOfWeek}) ${hours}:${minutes}`
    : `${month}월 ${day}일(${dayOfWeek}) ${hours}:${minutes}`;
};

/**
 * 🔔 NotificationScreen: 사용자가 설정한 모든 티켓 예매 알림을 관리하는 화면입니다.
 * 
 * Why: 캘린더에서 개별적으로 설정한 알림들을 한곳에서 모아보고, 필요 시 삭제하거나 
 * 상태(대기/완료)를 확인하여 티켓팅 일정을 효율적으로 관리하기 위함입니다.
 */
export default function NotificationScreen() {
  
  // 🎣 [Server State] TanStack Query를 이용한 선언적 데이터 관리
  const { data: pageResponse, isLoading, refetch } = useTicketAlarms(1, 100);
  const { deleteAlarm, isDeleting } = useTicketAlarmMutation();

  const alarms = useMemo(() => pageResponse?.content || [], [pageResponse]);

  const handleDeleteAlarm = (alarm: TicketAlarm) => {
    Alert.alert(
      "티켓 알림 삭제",
      `${alarm.stadiumName} - ${formatDate(alarm.matchTime, false)} 알림을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAlarm(alarm.alarmId);
              Alert.alert("성공", "티켓 알림이 삭제되었습니다.");
            } catch (error) {
              Logger.error("티켓 알림 삭제 실패", error);
            }
          },
        },
      ],
    );
  };

  const renderAlarmItem = ({ item }: { item: TicketAlarm }) => {
    // 💡 [Logic] 알림 완료 여부를 현재 시간과 alarmTime 비교를 통해 동적으로 결정 (Zero Magic)
    const isNotified = new Date(item.alarmTime) < new Date();

    return (
      <Box bg="card" p="SCREEN" rounded="md" mb="sm" flexDir="row" style={styles.alarmItem}>
        <Box flex={1}>
          <Typography variant="body1" weight="semibold" color="text.primary" mb="xs">
            {item.stadiumName}
          </Typography>
          <Typography variant="caption" color="text.secondary" mb="xs">
            {formatDate(item.matchTime)}
          </Typography>
          <Typography variant="body2" color="text.primary" mb="sm">
            {item.homeTeam} vs {item.awayTeam}
          </Typography>
          <Box align="flex-start">
            <Box 
              bg={isNotified ? "team.neutralLight" : "brand.mint"} 
              px="sm" 
              py="xs" 
              rounded="sm"
            >
              <Typography variant="caption" color="background" weight="bold">
                {isNotified ? "알림 완료" : `${item.minusBefore}분 전 알림 대기`}
              </Typography>
            </Box>
          </Box>
        </Box>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteAlarm(item)}
          disabled={isDeleting}
        >
          <Typography variant="caption" color="error" weight="bold">
            삭제
          </Typography>
        </TouchableOpacity>
      </Box>
    );
  };

  return (
    <SafeLayout style={styles.safeLayout}>
      <Box flex={1} p="SCREEN">
        <Box mb="SCREEN">
          <Typography variant="h2" weight="bold" color="text.primary">
            예매 알림 관리
          </Typography>
          <Typography variant="body2" color="text.secondary" mt="xs">
            설정한 예매 알림 내역입니다.
          </Typography>
        </Box>

        <List
          data={alarms}
          renderItem={renderAlarmItem}
          keyExtractor={(item) => item.alarmId.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <Box flex={1} justify="center" align="center" py="xxl">
              <Typography variant="body1" weight="semibold" color="text.secondary" mb="xs">
                등록된 알림이 없습니다.
              </Typography>
              <Typography variant="body2" color="text.tertiary" center>
                경기 일정에서 원하는 경기를 선택해 알림을 추가해보세요.
              </Typography>
            </Box>
          }
        />
      </Box>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    paddingBottom: theme.spacing.SCREEN,
  },
  alarmItem: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadow.card,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
    alignSelf: "flex-start",
  },
});
