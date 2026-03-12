import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Input } from "@/components/ui/input";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import { exchangeCreateAPI } from "@/src/features/exchange/api";
import { CreateExchangeDto } from "@/src/features/exchange/types";
import { FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.SCREEN,
    paddingTop: SPACING.COMPONENT,
    paddingBottom: 100, // 하단 고정 버튼을 위한 여백
  },
  header: {
    marginBottom: SPACING.SECTION,
  },
  title: {
    fontSize: FONT_SIZE.TITLE,
    fontWeight: "bold",
    marginBottom: SPACING.SMALL / 2,
  },
  subtitle: {
    fontSize: FONT_SIZE.BODY,
  },
  inputContainer: {
    marginBottom: SPACING.SECTION,
  },
  inputLabel: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    zIndex: 100,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    textAlign: "center",
  },
  applyButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLeftButton: {
    marginLeft: 0,
    marginRight: 16,
  },
  scrollView: {
    flex: 1,
  },
});

export default function ApplyExchangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const targetItemId = Number(id);
  const [message, setMessage] = useState("");

  const { mutate: requestExchange, isPending } = useMutation({
    mutationFn: async () => {
      const payload: CreateExchangeDto = {
        itemId: targetItemId,
      };
      const trimmedMessage = message.trim();
      if (trimmedMessage) {
        payload.message = trimmedMessage;
      }
      const response = await exchangeCreateAPI(payload);
      if (response.resultType !== "SUCCESS") {
        throw new Error(
          typeof response.error === "string"
            ? response.error
            : "교환 신청에 실패했습니다.",
        );
      }
      return response.data;
    },
    onSuccess: (data) => {
      const roomId =
        typeof data === "object" && data !== null
          ? ((data as { roomId?: number; directRoomId?: number }).roomId ??
            (data as { roomId?: number; directRoomId?: number }).directRoomId)
          : undefined;

      if (!roomId) {
        Alert.alert("성공", "교환 제안이 전달되었습니다. (채팅방 ID 획득 실패)");
        router.back();
        return;
      }

      Alert.alert("성공", "교환 신청이 완료되었습니다.");

      // 상태 무효화
      queryClient.invalidateQueries({ queryKey: ["item", id] });

      // 채팅방으로 이동시키며 교환 신청 페이지는 네비게이션 스택에서 제거
      router.replace(`/exchange/chat/${roomId}`);
    },
    onError: (error) => {
      Alert.alert("오류", "교환 신청에 실패했습니다.");
      Logger.error("교환 신청 실패:", error);
    },
  });

  const handleSubmit = useCallback(() => {
    requestExchange();
  }, [requestExchange]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "교환 제안하기",
          headerBackTitleVisible: false,
          headerBackVisible: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerLeftButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        } as any}
      />
      <SafeLayout edges={["top", "bottom"]} style={{ ...styles.container, backgroundColor: colors.background }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 안내 */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>교환 제안</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              상대방에게 교환을 원한다는 메시지를 남겨보세요.
            </Text>
          </View>

          {/* 메시지 입력 폼 */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              제안 메시지 (선택)
            </Text>
            <Input
              placeholder="예: 꼭 교환하고 싶어요! 제가 가진 물건 중에 원하시는게 있을까요?"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              style={styles.messageInput}
            />
          </View>
        </ScrollView>

        {/* 하단 고정 제출 영역 */}
        <View
          style={[
            styles.bottomContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.applyButton,
              {
                backgroundColor: isPending ? colors.muted : colors.primary,
              },
            ]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            <Text
              style={[
                styles.submitButtonText,
                { color: colors.background },
              ]}
            >
              {isPending ? "신청 중..." : "제안 보내기"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeLayout>
    </>
  );
}
