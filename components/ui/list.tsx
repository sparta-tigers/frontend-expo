import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "react-native-paper";

/**
 * 리스트 아이템 속성
 */
interface ListItemProps {
  /** 아이템 키 */
  key: string;
  /** 아이템 내용 */
  content: React.ReactNode;
  /** 아이템 클릭 핸들러 */
  onPress?: () => void;
  /** 아이템 스타일 */
  style?: ViewStyle;
}

/**
 * 리스트 컴포넌트 속성
 */
interface ListProps {
  /** 리스트 데이터 */
  data: any[];
  /** 아이템 렌더 함수 */
  renderItem: ListRenderItem<any>;
  /** 로딩 상태 */
  loading?: boolean;
  /** 더 불러오기 핸들러 */
  onEndReached?: () => void;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  /** 커스텀 스타일 */
  style?: ViewStyle;
  /** 아이템 구분선 표시 */
  showSeparator?: boolean;
}

/**
 * 기본 List 컴포넌트
 *
 * PWA의 ul/li 태그를 React Native FlatList로 대체
 * - 성능 최적화된 리스트 렌더링
 * - 무한 스크롤 지원
 * - 빈 상태 처리
 */
export const List: React.FC<ListProps> = ({
  data,
  renderItem,
  loading = false,
  onEndReached,
  emptyMessage = "데이터가 없습니다.",
  style,
  showSeparator = true,
}) => {
  const theme = useTheme();

  const renderSeparator = () => {
    if (!showSeparator) return null;

    return (
      <View
        style={[styles.separator, { backgroundColor: theme.colors.outline }]}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
        {emptyMessage}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            더 불러오는 중...
          </Text>
        </View>
      );
    }
    return null;
  };

  if (loading && data.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.surface },
          style,
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            로딩 중...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
    >
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?.id?.toString() || item?.key?.toString() || index.toString()
        }
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          data.length === 0 ? styles.emptyContent : undefined
        }
      />
    </View>
  );
};

/**
 * ListItem 컴포넌트
 *
 * 리스트 개별 아이템을 표시
 */
export const ListItem: React.FC<ListItemProps> = ({
  content,
  onPress,
  style,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme.colors.surface }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
});
