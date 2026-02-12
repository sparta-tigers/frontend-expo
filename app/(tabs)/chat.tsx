import { chatroomsGetListAPI } from "@/src/api/chatrooms";
import { ApiResponse, ResultType } from "@/src/api/index";
import { DirectRoomResponse } from "@/src/api/types/chatrooms";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 정적 스타일 정의
const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 8,
  },
  chatRoomItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  chatInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    color: "#666",
  },
  date: {
    fontSize: 12,
    color: "#999",
    position: "absolute",
    top: 16,
    right: 16,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
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
    fontSize: 16,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

/**
 * 채팅방 목록 화면
 * 사용자가 속한 모든 1:1 채팅방 목록을 보여주는 탭 페이지
 */
export default function ChatListScreen() {
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<DirectRoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 채팅방 목록 로드 함수
  const loadChatRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response: ApiResponse<any> = await chatroomsGetListAPI(0, 20);

      if (response.resultType === ResultType.SUCCESS && response.data) {
        setChatRooms(response.data.content || []);
      } else {
        setError(
          response.error?.message || "채팅방 목록을 불러오는데 실패했습니다.",
        );
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
      console.error("Error loading chat rooms:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 탭이 포커스될 때마다 목록 갱신
  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
    }, [loadChatRooms]),
  );

  // 채팅방 렌더 함수
  const renderChatRoom = useCallback(
    ({ item }: { item: DirectRoomResponse }) => (
      <TouchableOpacity
        style={chatStyles.chatRoomItem}
        onPress={() => router.push(`/chat/${item.directRoomId}`)}
        activeOpacity={0.7}
      >
        {/* 아바타 */}
        <View style={chatStyles.avatar}>
          <Text style={chatStyles.avatarText}>
            {item.opponentNickname.charAt(0).toUpperCase()}
          </Text>
          {item.opponentOnline && <View style={chatStyles.onlineIndicator} />}
        </View>

        {/* 채팅 정보 */}
        <View style={chatStyles.chatInfo}>
          <Text style={chatStyles.nickname}>{item.opponentNickname}</Text>
          <Text style={chatStyles.itemTitle}>{item.itemTitle}</Text>
        </View>

        {/* 시간 */}
        <Text style={chatStyles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    ),
    [router],
  );

  // 로딩 상태
  if (isLoading && chatRooms.length === 0) {
    return (
      <View style={chatStyles.emptyContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={chatStyles.loadingText}>채팅방 목록을 불러오는 중...</Text>
      </View>
    );
  }

  // 에러 상태
  if (error && chatRooms.length === 0) {
    return (
      <View style={chatStyles.emptyContainer}>
        <Text style={chatStyles.errorText}>{error}</Text>
        <TouchableOpacity
          style={chatStyles.retryButton}
          onPress={loadChatRooms}
        >
          <Text style={chatStyles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 빈 상태
  if (chatRooms.length === 0) {
    return (
      <View style={chatStyles.emptyContainer}>
        <Text style={chatStyles.emptyText}>채팅방이 없습니다</Text>
        <Text style={chatStyles.emptySubText}>아이템 교환을 시작해보세요</Text>
      </View>
    );
  }

  return (
    <View style={chatStyles.container}>
      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.directRoomId.toString()}
        refreshing={isLoading}
        onRefresh={loadChatRooms}
        contentContainerStyle={chatStyles.listContainer}
      />
    </View>
  );
}
