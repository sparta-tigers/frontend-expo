import { Box, Button, Input, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useAuth } from "@/context/AuthContext";
import { useTicketAlarmMutation } from "@/src/features/ticket-alarm/hooks/useTicketAlarm";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";

/**
 * 🔔 TicketAlarmFormScreen: 티켓 예매 알림 설정 화면
 *
 * Why: 사용자가 특정 경기에 대해 알림 시점과 멤버십 정보를 설정함.
 * 바텀시트 대신 독립된 페이지를 사용하여 직관 기록과 일관된 내비게이션 경험을 제공함.
 */
export default function TicketAlarmFormScreen() {
  const { matchId, from } = useLocalSearchParams<{ matchId: string; from?: string }>();
  const matchIdNumber = Number(matchId);
  const { myTeamId } = useAuth();

  const [preAlarmTime, setPreAlarmTime] = useState(30); // 기본 30분 전
  const [membership, setMembership] = useState("");
  const { createAlarm, isCreating } = useTicketAlarmMutation();

  /**
   * 알림 저장 핸들러
   * Why: 작성된 설정을 백엔드에 전송하여 예매 알림을 등록함.
   */
  const handleSave = async () => {
    if (!matchId || Number.isNaN(matchIdNumber) || myTeamId == null) {
      Logger.error("Missing or invalid matchId or teamId", { matchId, matchIdNumber, myTeamId });
      Alert.alert("오류", "필수 정보가 누락되었거나 유효하지 않습니다.");
      return;
    }

    try {
      await createAlarm({
        matchId: matchIdNumber,
        teamId: myTeamId,
        preAlarmTime,
        ...(membership.trim() ? { membership: membership.trim() } : {}),
      });

      Alert.alert("성공", "예매 알림이 설정되었습니다.", [
        { 
          text: "확인", 
          onPress: () => {
            if (from === "notification") {
              // 🔄 알림 관리 페이지에서 온 경우, 스케줄을 건너뛰고 즉시 복귀
              router.replace("/(tabs)/notification");
            } else {
              router.back();
            }
          } 
        },
      ]);
    } catch (error) {
      Logger.error("Failed to create alarm", { error });
      // 에러는 Mutation Hook 내부에서 이미 Alert 처리됨
    }
  };

  return (
    <SafeLayout style={styles.safeLayout}>
      <ScrollView contentContainerStyle={styles.container}>
        <Box mb="xxl">
          <Typography variant="h2" weight="bold" color="text.primary" mb="xs">
            예매 알림 설정
          </Typography>
          <Typography variant="body2" color="text.secondary">
            경기 예매 시작 전 잊지 않도록 알림을 보내드릴게요.
          </Typography>
        </Box>

        <Box
          mb="xxl"
          p="lg"
          bg="surface"
          rounded="lg"
          borderWidth={1}
          borderColor="border.medium"
        >
          <Box flexDir="row" justify="space-between" align="center" mb="md">
            <Typography variant="body1" weight="bold">
              알림 시점
            </Typography>
            <Typography variant="h3" color="brand.mint" weight="bold">
              {preAlarmTime}분 전
            </Typography>
          </Box>

          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={180}
            step={1}
            value={preAlarmTime}
            onValueChange={setPreAlarmTime}
            minimumTrackTintColor={theme.colors.brand.mint}
            maximumTrackTintColor={theme.colors.border.light}
            thumbTintColor={theme.colors.brand.mint}
          />

          <Box flexDir="row" justify="space-between" mt="xs">
            <Typography variant="caption" color="text.secondary">
              1분 전
            </Typography>
            <Typography variant="caption" color="text.secondary">
              3시간 전
            </Typography>
          </Box>
        </Box>

        <Box mb="xxl">
          <Typography variant="label" color="text.primary" mb="sm">
            멤버십 정보 (선택)
          </Typography>
          <Input
            placeholder="예: 씰 멤버십, 골드 회원 등"
            value={membership}
            onChangeText={setMembership}
            style={styles.input}
          />
          <Typography variant="caption" color="text.secondary" mt="xs">
            선예매 멤버십이 있다면 기록해두세요.
          </Typography>
        </Box>

        <Box mt="xl" pt="xl">
          <Button
            onPress={handleSave}
            disabled={isCreating}
            loading={isCreating}
            size="lg"
          >
            알림 신청하기
          </Button>
        </Box>
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.SCREEN,
    flexGrow: 1,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border.medium,
  },
});
