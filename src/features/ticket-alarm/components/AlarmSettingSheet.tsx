import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Box, Button, Typography, Input } from "@/components/ui";
import { theme } from "@/src/styles/theme";
import Slider from "@react-native-community/slider";
import { useTicketAlarmMutation } from "../hooks/useTicketAlarm";
import { Logger } from "@/src/utils/logger";

interface AlarmSettingSheetProps {
  modalRef: React.RefObject<BottomSheetModal | null>;
  matchId: number | null;
  teamId: number | null;
  matchTitle: string;
  onSuccess?: () => void;
}

/**
 * 🚨 앙드레 카파시: 티켓 예매 알림 설정 바텀 시트
 * 
 * Why: 사용자가 특정 경기의 예매 알림을 직관적으로 설정할 수 있도록 함.
 * Zero Magic: 상태 관리를 단순하게 유지하고 비동기 처리를 명시적으로 수행함.
 */
export function AlarmSettingSheet({ 
  modalRef, 
  matchId, 
  teamId, 
  matchTitle,
  onSuccess 
}: AlarmSettingSheetProps) {
  const [preAlarmTime, setPreAlarmTime] = useState(30); // 기본 30분 전
  const [membership, setMembership] = useState("");
  const { createAlarm, isCreating } = useTicketAlarmMutation();

  const snapPoints = useMemo(() => ["50%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  const handleSave = async () => {
    if (!matchId || !teamId) {
      Logger.error("Missing matchId or teamId");
      return;
    }

    try {
      await createAlarm({
        matchId,
        teamId,
        preAlarmTime,
        ...(membership.trim() ? { membership: membership.trim() } : {}),
      });
      modalRef.current?.dismiss();
      onSuccess?.();
    } catch {
      // Error is handled in hook
    }
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
    >
      <Box px="xl" py="lg" flex={1}>
        <Box mb="xl">
          <Typography variant="h3" weight="bold" color="text.primary">
            예매 알림 설정
          </Typography>
          <Typography variant="body2" color="text.secondary" mt="xs">
            {matchTitle}
          </Typography>
        </Box>

        <Box mb="xl">
          <Box flexDir="row" justify="space-between" align="center" mb="sm">
            <Typography variant="body1" weight="medium">
              알림 시점
            </Typography>
            <Typography variant="h4" color="brand.mint" weight="bold">
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
          <Box flexDir="row" justify="space-between" mt="xxs">
            <Typography variant="caption" color="text.secondary">1분 전</Typography>
            <Typography variant="caption" color="text.secondary">3시간 전</Typography>
          </Box>
        </Box>

        <Box mb="xl">
          <Typography variant="body1" weight="medium" mb="sm">
            멤버십 정보 (선택)
          </Typography>
          <Input
            placeholder="예: 씰 멤버십, 골드 회원 등"
            value={membership}
            onChangeText={setMembership}
            style={styles.input}
          />
        </Box>

        <Box mt="xxxxl" pb="xxl">
          <Button 
            onPress={handleSave} 
            disabled={isCreating}
            loading={isCreating}
          >
            알림 신청하기
          </Button>
        </Box>
      </Box>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: theme.colors.border.light,
    width: 40,
  },
  background: {
    backgroundColor: theme.colors.background,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  input: {
    backgroundColor: theme.colors.team.neutralLight,
    borderWidth: 0,
  },
});
