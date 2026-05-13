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

/**
 * 📝 AlarmSettingSheetProps: 알림 설정 시트의 외부 제어 계약(Contract)
 * 
 * Why: 컴포넌트 호출부에서 필수 데이터(식별자, 타이틀)와 제어용 Refs를 명확히 전달하도록 강제하여, 
 * 데이터 흐름을 예측 가능하게 만들고 UI 상태와 도메인 데이터를 동기화하기 위함입니다.
 */
interface AlarmSettingSheetProps {
  modalRef: React.RefObject<BottomSheetModal | null>;
  matchId: number | null;
  teamId: number | null;
  matchTitle: string;
  onSuccess?: () => void;
}

/**
 * 🔔 AlarmSettingSheet: 사용자가 특정 경기의 티켓 예매 알림을 설정하는 BottomSheet 레이어입니다.
 * 
 * Why: 메인 캘린더 화면의 맥락(Context)을 유지한 상태에서, 특정 경기에 대한 부가 설정(시간, 멤버십)을 
 * 독립된 모달 레이어에서 처리함으로써 UX 흐름을 매끄럽게 연결하고 단일 책임 원칙을 준수하기 위함입니다.
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
    /** 🛡 [Guard] 명시적 식별자 검증: 유효 ID(0 등) 오판 방지를 위해 null/undefined 체크 수행 */
    if (matchId == null || teamId == null) {
      Logger.error("Missing matchId or teamId", { matchId, teamId });
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
