// src/features/user/components/TeamSelectSheet.tsx
import { Box } from "@/components/ui/box";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Typography } from "@/components/ui/typography";
import {
  LOCAL_LAYOUT,
  styles,
} from "@/src/features/user/styles/profile.styles";
import { KBO_TEAMS } from "@/src/features/user/types";
import { theme } from "@/src/styles/theme";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React from "react";
import { TouchableOpacity } from "react-native";

interface TeamSelectSheetProps {
  modalRef: React.RefObject<BottomSheetModal | null>;
  onSelectTeam: (team: (typeof KBO_TEAMS)[number]) => void;
}

/**
 * TeamSelectSheet
 *
 * Why: 사용자가 즐겨찾는 KBO 구단을 선택할 수 있는 바텀 시트 인터페이스 제공.
 */
export function TeamSelectSheet({
  modalRef,
  onSelectTeam,
}: TeamSelectSheetProps) {
  const snapPoints = LOCAL_LAYOUT.bottomSheetSnapPoints as unknown as (
    | string
    | number
  )[];

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.sheetIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
        <Box px="xl" py="lg">
          <Typography variant="h3" weight="bold" mb="lg">
            즐겨찾기 팀 선택
          </Typography>
          <Box gap="sm">
            {KBO_TEAMS.map((team) => (
              <TouchableOpacity
                key={team.code}
                activeOpacity={0.7}
                onPress={() => onSelectTeam(team)}
                style={styles.teamItem}
              >
                <Box flexDir="row" align="center" justify="space-between">
                  <Typography variant="body1">{team.name}</Typography>
                  <IconSymbol
                    name="plus.circle"
                    size={20}
                    color={theme.colors.brand.mint}
                  />
                </Box>
              </TouchableOpacity>
            ))}
          </Box>
        </Box>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
