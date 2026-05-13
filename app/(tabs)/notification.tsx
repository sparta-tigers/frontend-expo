import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import { formatToKoreanDateTime } from "@/src/utils/date";
import React, { useMemo } from "react";
import {
    Alert,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Box, Typography, List } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTicketAlarms, useTicketAlarmMutation } from "@/src/features/ticket-alarm/hooks/useTicketAlarm";
import { TicketAlarm } from "@/src/features/ticket-alarm/types";

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
      `${alarm.stadiumName} - ${formatToKoreanDateTime(alarm.matchTime, false)} 알림을 삭제하시겠습니까?`,
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
          renderItem={({ item }) => (
            <AlarmItem 
              item={item} 
              onDelete={handleDeleteAlarm} 
              isDeleting={isDeleting} 
            />
          )}
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

      {/* ➕ 알림 추가 FAB: 직관 일기 탭과 동일한 플로우 제공 */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push("/schedule?from=notification")}
      >
        <Ionicons name="add" size={32} color={theme.colors.background} />
      </TouchableOpacity>
    </SafeLayout>
  );
}

/**
 * 🔔 AlarmItem: 개별 예매 알림 아이템 컴포넌트
 * Why: 독립된 컴포넌트로 분리하여 useMemo 등 Hook을 안전하게 사용하고 리렌더링을 최적화함.
 */
const AlarmItem = React.memo(({ 
  item, 
  onDelete, 
  isDeleting 
}: { 
  item: TicketAlarm; 
  onDelete: (alarm: TicketAlarm) => void; 
  isDeleting: boolean;
}) => {
  // 💡 [Logic] 알림 완료 여부를 현재 시간과 alarmTime 비교를 통해 동적으로 결정
  const isNotified = useMemo(() => new Date(item.alarmTime) < new Date(), [item.alarmTime]);

  return (
    <Box bg="card" p="SCREEN" rounded="md" mb="sm" flexDir="row" style={styles.alarmItem}>
      <Box flex={1}>
        <Typography variant="body1" weight="semibold" color="text.primary" mb="xs">
          {item.stadiumName}
        </Typography>
        <Typography variant="caption" color="text.secondary" mb="xs">
          {formatToKoreanDateTime(item.matchTime)}
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
        onPress={() => onDelete(item)}
        disabled={isDeleting}
      >
        <Typography variant="caption" color="error" weight="bold">
          삭제
        </Typography>
      </TouchableOpacity>
    </Box>
  );
});

AlarmItem.displayName = "AlarmItem";

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
  fab: {
    position: "absolute",
    bottom: theme.spacing.SCREEN + theme.layout.tabBar.height,
    right: theme.spacing.SCREEN,
    width: theme.layout.fab.size,
    height: theme.layout.fab.size,
    borderRadius: theme.layout.fab.size / 2,
    backgroundColor: theme.colors.brand.mint,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadow.card,
  },
});
