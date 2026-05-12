import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import { chatroomsGetListAPI } from "@/src/features/chat/api";
import { DirectRoomResponse, DirectRoomListResponse } from "@/src/features/chat/types";
import { ApiResponse } from "@/src/shared/types/common";
import {
    BORDER_RADIUS,
    FONT_SIZE,
    theme,
    SPACING,
} from "@/src/styles/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// 정적 스타일 정의
const chatStyles = StyleSheet.create({
  listContainer: {
    padding: SPACING.SMALL,
  },
  chatRoomItem: {
    flexDirection: "row",
    padding: SPACING.COMPONENT,
    borderBottomWidth: 1,
    borderRadius: BORDER_RADIUS.CARD,
    marginVertical: SPACING.TINY,
    marginHorizontal: SPACING.SMALL,
    ...theme.shadow.card,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.COMPONENT,
  },
  avatarText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
    marginBottom: SPACING.TINY,
  },
  itemTitle: {
    fontSize: FONT_SIZE.SMALL,
  },
  date: {
    fontSize: FONT_SIZE.CAPTION,
    position: "absolute",
    top: SPACING.COMPONENT,
    right: SPACING.COMPONENT,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    marginBottom: SPACING.SMALL,
  },
  emptySubText: {
    fontSize: FONT_SIZE.SMALL,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: SPACING.SMALL,
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: FONT_SIZE.BODY,
    marginBottom: SPACING.COMPONENT,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 120,
  },
});

/**
 * 채팅방 목록 화면
 * 사용자가 속한 모든 1:1 채팅방 목록을 보여주는 탭 페이지
 */
export default function ChatListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // 🚨 앙드레 카파시: useAsyncState 폐기 및 React Query(useQuery) 도입
  // 탭 전환 시 매번 로딩 스피너를 보여주는 대신 캐시를 활용하여 즉시 렌더링
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["chatRooms"],
    queryFn: async (): Promise<DirectRoomResponse[]> => {
      const response: ApiResponse<DirectRoomListResponse> = await chatroomsGetListAPI(0, 50); // 임시 페이지네이션
      if (response.resultType === "SUCCESS" && response.data) {
        // DirectRoomListResponse.rooms가 실제 배열임
        return response.data.rooms || [];
      }
      throw new Error(response.error?.message || "채팅방 목록을 불러오는데 실패했습니다.");
    },
    staleTime: 1000 * 60 * 1, // 1분간 캐시 유지
  });

  // 탭이 포커스될 때마다 캐시를 무효화하여 백그라운드에서 조용히 갱신 (로딩 스피너 방지)
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
    }, [queryClient]),
  );

  // 채팅방 렌더 함수
  const renderChatRoom = useCallback(
    ({ item }: { item: DirectRoomResponse }) => (
      <TouchableOpacity
        style={[
          chatStyles.chatRoomItem,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() => router.push(`/exchange/chat/${item.directRoomId}`)}
        activeOpacity={0.7}
      >
        {/* 아바타 */}
        <View style={[chatStyles.avatar, { backgroundColor: colors.card }]}>
          <Text style={[chatStyles.avatarText, { color: colors.muted }]}>
            {item.opponentNickname.charAt(0).toUpperCase()}
          </Text>
          {item.opponentOnline && (
            <View
              style={[
                chatStyles.onlineIndicator,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </View>

        {/* 채팅 정보 */}
        <View style={chatStyles.chatInfo}>
          <Text style={[chatStyles.nickname, { color: colors.text }]}>
            {item.opponentNickname}
          </Text>
          <Text style={[chatStyles.itemTitle, { color: colors.muted }]}>
            {item.itemTitle}
          </Text>
        </View>

        {/* 시간 */}
        <Text style={[chatStyles.date, { color: colors.muted }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    ),
    [router, colors],
  );

  // 로딩 상태 (캐시가 없을 때만 보여줌)
  if (isLoading && (!data || (data as DirectRoomResponse[]).length === 0)) {
    return (
      <View
        style={[
          chatStyles.loadingContainer,
          { backgroundColor: colors.surface },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[chatStyles.loadingText, { color: colors.text }]}>
          채팅방 목록을 불러오는 중...
        </Text>
      </View>
    );
  }

  // 에러 상태 (캐시가 없을 때만 보여줌)
  if (isError && (!data || (data as DirectRoomResponse[]).length === 0)) {
    return (
      <View
        style={[chatStyles.errorContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[chatStyles.errorText, { color: colors.destructive }]}>
          {error?.message || "오류가 발생했습니다."}
        </Text>
        <Button
          onPress={() => refetch()}
          style={chatStyles.retryButton}
        >
          다시 시도
        </Button>
      </View>
    );
  }

  // 빈 상태
  if (!data || (data as DirectRoomResponse[]).length === 0) {
    return (
      <View
        style={[chatStyles.emptyContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[chatStyles.emptyText, { color: colors.text }]}>
          채팅방이 없습니다
        </Text>
        <Text style={[chatStyles.emptySubText, { color: colors.muted }]}>
          아이템 교환을 시작해보세요
        </Text>
      </View>
    );
  }

  return (
    <SafeLayout style={{ backgroundColor: colors.surface }}>
      <FlatList
        data={data || []}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.directRoomId.toString()}
        refreshing={isFetching && !isLoading}
        onRefresh={() => refetch()}
        contentContainerStyle={chatStyles.listContainer}
      />
    </SafeLayout>
  );
}
