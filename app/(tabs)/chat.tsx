import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { chatroomsGetListAPI } from "@/src/api/chatrooms";
import { DirectRoomResponse } from "@/src/api/types/chatrooms";
import { ApiResponse, ResultType } from "@/src/api/index";

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
          response.error?.message || "채팅방 목록을 불러오는데 실패했습니다",
        );
      }
    } catch (err) {
      console.error("채팅방 목록 로드 에러:", err);
      setError("네트워크 오류가 발생했습니다");
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

  // 채팅방 아이템 렌더링
  const renderChatRoom = useCallback(
    ({ item }: { item: DirectRoomResponse }) => (
      <TouchableOpacity
        style={styles.chatRoomItem}
        onPress={() => router.push(`/chat/${item.directRoomId}` as any)}
      >
        {/* 아이템 이미지 */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>IMG</Text>
        </View>

        {/* 채팅방 정보 */}
        <View style={styles.chatInfo}>
          <Text style={styles.nickname}>{item.opponentNickname}</Text>
          <Text style={styles.itemTitle}>{item.itemTitle}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* 온라인 상태 */}
        <View
          style={[
            styles.onlineIndicator,
            { backgroundColor: item.opponentOnline ? "#4CAF50" : "#ccc" },
          ]}
        />
      </TouchableOpacity>
    ),
    [router],
  );

  // 로딩 상태
  if (isLoading && chatRooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>채팅방 목록을 불러오는 중...</Text>
      </View>
    );
  }

  // 에러 상태
  if (error && chatRooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChatRooms}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 빈 상태
  if (chatRooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>채팅방이 없습니다</Text>
        <Text style={styles.emptySubText}>
          아이템 교환을 시작하면 채팅방이 생성됩니다
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.directRoomId.toString()}
        refreshing={isLoading}
        onRefresh={loadChatRooms}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    backgroundColor: "#f5f5f5",
  },
  chatRoomItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 12,
    color: "#666",
  },
  chatInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  itemTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
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
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
