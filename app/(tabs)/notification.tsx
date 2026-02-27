import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
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
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function NotificationScreen() {
  const { colors } = useTheme();
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
        console.error("티켓 알림 목록 조회 실패:", response.error);
      }
    } catch (error) {
      console.error("네트워크 에러:", error);
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

    // 간단한 예시: 첫 번째 경기장과 오늘 날짜로 알림 추가
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
                opponentTeam: "상대팀", // 실제로는 선택 가능해야 함
              };

              const response = await ticketAlarmAddAPI(request);

              if (response.resultType === "SUCCESS") {
                Alert.alert("성공", "티켓 알림이 추가되었습니다.");
                await loadAlarms(); // 목록 새로고침
              } else {
                Alert.alert("오류", "티켓 알림 추가에 실패했습니다.");
              }
            } catch (error) {
              console.error("티켓 알림 추가 실패:", error);
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // 티켓 알림 삭제 핸들러
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
                await loadAlarms(); // 목록 새로고침
              } else {
                Alert.alert("오류", "티켓 알림 삭제에 실패했습니다.");
              }
            } catch (error) {
              console.error("티켓 알림 삭제 실패:", error);
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // 알림 아이템 렌더링
  const renderAlarmItem = ({ item }: { item: TicketAlarm }) => (
    <View style={[styles.alarmItem, { backgroundColor: colors.card }]}>
      <View style={styles.alarmContent}>
        <Text style={[styles.alarmStadium, { color: colors.text }]}>
          {item.stadiumName}
        </Text>
        <Text style={[styles.alarmDate, { color: colors.muted }]}>
          {item.gameDate}
        </Text>
        <Text style={[styles.alarmOpponent, { color: colors.text }]}>
          vs {item.opponentTeam}
        </Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.isNotified
                  ? colors.destructive
                  : colors.primary,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.background }]}>
              {item.isNotified ? "알림 완료" : "대기 중"}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.deleteButton, { borderColor: colors.destructive }]}
        onPress={() => handleDeleteAlarm(item)}
        disabled={loading}
      >
        <Text style={[styles.deleteButtonText, { color: colors.destructive }]}>
          삭제
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 로그인되지 않은 상태
  if (!user?.accessToken) {
    return (
      <SafeLayout style={{ backgroundColor: colors.background }}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: colors.text }]}>예매알림</Text>
          <Text style={[styles.description, { color: colors.muted }]}>
            로그인이 필요한 기능입니다.
          </Text>
          <Button
            onPress={() => router.push("/(auth)/signin")}
            style={styles.loginButton}
          >
            로그인
          </Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>예매알림</Text>
          <Button onPress={handleAddAlarm} disabled={loading}>
            알림 추가
          </Button>
        </View>

        <FlatList
          data={alarms}
          renderItem={renderAlarmItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                등록된 알림이 없습니다.
              </Text>
              <Text style={[styles.emptySubText, { color: colors.muted }]}>
                알림 추가 버튼을 눌러 새로운 알림을 설정해보세요.
              </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={loadAlarms}
        />
      </View>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.SMALL,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: SPACING.SMALL,
  },
  loginButton: {
    marginTop: SPACING.SMALL,
  },
  listContainer: {
    gap: SPACING.SMALL,
  },
  alarmItem: {
    flexDirection: "row",
    padding: SPACING.COMPONENT,
    borderRadius: 8,
    marginBottom: SPACING.SMALL,
    borderWidth: 1,
    borderColor: "transparent",
  },
  alarmContent: {
    flex: 1,
  },
  alarmStadium: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: SPACING.SMALL / 2,
  },
  alarmDate: {
    fontSize: 14,
    marginBottom: SPACING.SMALL / 2,
  },
  alarmOpponent: {
    fontSize: 14,
    marginBottom: SPACING.SMALL,
  },
  statusContainer: {
    alignSelf: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: SPACING.SMALL / 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: SPACING.SMALL / 2,
    marginLeft: SPACING.SMALL,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.SCREEN * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: SPACING.SMALL / 2,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
  },
});
