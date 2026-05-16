// src/features/liveboard/components/TextBroadcastPanel.tsx
import React, { memo } from "react";
import { View, Text, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { BroadcastItem } from "../types";
import { useTextBroadcast } from "../hooks/useTextBroadcast";
import { styles } from "../styles/matchId.styles";

interface TextBroadcastPanelProps {
  inningTexts?: { [inning: number]: BroadcastItem[] } | undefined;
  isVisible: boolean;
}

/**
 * TextBroadcastItem Component
 * Why: 개별 중계 아이템의 타입별 스타일 분기를 담당.
 * Zero Magic: 매퍼에서 결정된 type을 기반으로 스타일만 입힘.
 */
const TextBroadcastItem = memo(({ item }: { item: BroadcastItem }) => {
  const itemStyle = [
    styles.broadcastItem,
    item.type === "BATTER_INFO" && styles.broadcastItemBatter,
    item.type === "INNING_INFO" && styles.broadcastItemInning,
  ];

  const textStyle = [
    styles.broadcastText,
    item.type === "PITCH_LOG" && styles.broadcastTextPitch,
    item.type === "BATTER_INFO" && styles.broadcastTextBatter,
    item.type === "INNING_INFO" && styles.broadcastTextInning,
  ];

  return (
    <View style={itemStyle}>
      <Text style={textStyle}>{item.text}</Text>
    </View>
  );
});
TextBroadcastItem.displayName = "TextBroadcastItem";

/**
 * TextBroadcastPanel Component
 * Why: 텍스트 중계 탭의 메인 컨테이너. 이닝 선택 칩과 중계 리스트를 관리.
 */
export const TextBroadcastPanel = memo(({ inningTexts, isVisible }: TextBroadcastPanelProps) => {
  const { activeInning, setActiveInning, availableInnings, filteredBroadcast } = useTextBroadcast(inningTexts);

  if (!isVisible) return null;

  return (
    <View style={styles.tabPanel}>
      {/* 이닝 선택 칩 (Horizontal Scroll) */}
      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inningChipList}
        >
          {availableInnings.map((inning) => (
            <TouchableOpacity
              key={inning}
              style={[
                styles.inningChip,
                activeInning === inning && styles.inningChipActive
              ]}
              onPress={() => setActiveInning(inning)}
            >
              <Text style={[
                styles.inningChipText,
                activeInning === inning && styles.inningChipTextActive
              ]}>
                {inning === 10 ? "연장" : `${inning}회`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 중계 리스트 (FlatList optimized) */}
      <FlatList
        data={filteredBroadcast}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TextBroadcastItem item={item} />}
        contentContainerStyle={styles.broadcastList}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.broadcastEmpty}>
            <Text style={styles.broadcastEmptyText}>해당 이닝의 중계 데이터가 없습니다.</Text>
          </View>
        }
      />
    </View>
  );
});

TextBroadcastPanel.displayName = "TextBroadcastPanel";
