import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import {
    ticketAlarmAddAPI,
    ticketAlarmDeleteAPI,
    ticketAlarmGetListAPI,
} from "@/src/features/notification/api";
import {
    AddTicketAlarmRequest,
    STADIUMS,
    TicketAlarm,
} from "@/src/features/notification/types";
import { useAuth } from "@/src/hooks/useAuth";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Box, Typography } from "@/components/ui";

export default function NotificationScreen() {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<TicketAlarm[]>([]);
  const [loading, setLoading] = useState(false);

  // 티켓 알림 목록 로드
  const loadAlarms = useCallback(async () => {
    if (!user?.accessToken) return;

    setLoading(true);
    try {
      const response = await ticketAlarmGetListAPI();
      if (response.resultType === "SUCCESS") {
        setAlarms(response.data || []);
      } else {
        Logger.error("티켓 알림 목록 조회 실패:", response.error);
      }
    } catch (error) {
      Logger.error(
        "네트워크 에러:",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setLoading(false);
    }
  }, [user?.accessToken]);

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  // 티켓 알림 추가 핸들러
  const handleAddAlarm = () => {
    if (!user?.accessToken) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const stadium = STADIUMS[0];

    Alert.alert(
      "티켓 알림 추가",
      `${stadium.name}에서 ${today} 경기 알림을 추가하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "추가",
          onPress: async () => {
            setLoading(true);
            try {
              const request: AddTicketAlarmRequest = {
                stadiumName: stadium.name,
                gameDate: today,
                opponentTeam: "상대팀",
              };

              const response = await ticketAlarmAddAPI(request);

              if (response.resultType === "SUCCESS") {
                Alert.alert("성공", "티켓 알림이 추가되었습니다.");
                await loadAlarms();
              } else {
                Alert.alert("오류", "티켓 알림 추가에 실패했습니다.");
              }
            } catch (error) {
              Logger.error(
                "티켓 알림 추가 실패:",
                error instanceof Error ? error.message : String(error),
              );
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteAlarm = (alarm: TicketAlarm) => {
    Alert.alert(
      "티켓 알림 삭제",
      `${alarm.stadiumName} - ${alarm.gameDate} 알림을 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await ticketAlarmDeleteAPI(alarm.id);

              if (response.resultType === "SUCCESS") {
                Alert.alert("성공", "티켓 알림이 삭제되었습니다.");
                await loadAlarms();
              } else {
                Alert.alert("오류", "티켓 알림 삭제에 실패했습니다.");
              }
            } catch (error) {
              Logger.error(
                "티켓 알림 삭제 실패:",
                error instanceof Error ? error.message : String(error),
              );
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderAlarmItem = ({ item }: { item: TicketAlarm }) => (
    <Box bg="card" p="SCREEN" rounded="md" mb="sm" flexDir="row" style={[styles.alarmItem, theme.shadow.card]}>
      <Box flex={1}>
        <Typography variant="body1" weight="semibold" color="text.primary" mb="xs">
          {item.stadiumName}
        </Typography>
        <Typography variant="caption" color="text.secondary" mb="xs">
          {item.gameDate}
        </Typography>
        <Typography variant="body2" color="text.primary" mb="sm">
          vs {item.opponentTeam}
        </Typography>
        <Box align="flex-start">
          <Box 
            bg={item.isNotified ? "error" : "primary"} 
            px="sm" 
            py={2} 
            rounded="sm"
          >
            <Typography variant="caption" color="background" weight="bold">
              {item.isNotified ? "알림 완료" : "대기 중"}
            </Typography>
          </Box>
        </Box>
      </Box>
      <TouchableOpacity
        style={[styles.deleteButton, { borderColor: theme.colors.error }]}
        onPress={() => handleDeleteAlarm(item)}
        disabled={loading}
      >
        <Typography variant="caption" color="error" weight="bold">
          삭제
        </Typography>
      </TouchableOpacity>
    </Box>
  );

  return (
    <SafeLayout style={styles.safeLayout}>
      <Box flex={1} p="SCREEN">
        <Box flexDir="row" justify="space-between" align="center" mb="SCREEN">
          <Typography variant="h2" weight="bold" color="text.primary">
            예매알림
          </Typography>
          <Button onPress={handleAddAlarm} disabled={loading} size="sm">
            알림 추가
          </Button>
        </Box>

        <FlatList
          data={alarms}
          renderItem={renderAlarmItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Box flex={1} justify="center" align="center" py="xxl">
              <Typography variant="body1" weight="semibold" color="text.secondary" mb="xs">
                등록된 알림이 없습니다.
              </Typography>
              <Typography variant="body2" color="text.tertiary" center>
                알림 추가 버튼을 눌러 새로운 알림을 설정해보세요.
              </Typography>
            </Box>
          }
          refreshing={loading}
          onRefresh={loadAlarms}
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
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
    alignSelf: "flex-start",
  },
});
