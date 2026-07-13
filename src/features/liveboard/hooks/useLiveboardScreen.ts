import { useLiveboardData } from '@/src/features/liveboard/hooks/useLiveboardData';
import { LiveboardMapper } from '@/src/features/liveboard/mapper';
import { useMatchDetail } from '@/src/features/match';
import { useAuth } from '@/src/hooks/useAuth';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { Logger } from '@/src/utils/logger';
import { isValidTeamCode } from '@/src/utils/team';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

const liveboardLogger = Logger.category('CHAT');

export type TabKey = 'chat' | 'text' | 'lineup' | 'weather';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'chat', label: '라이브채팅' },
  { key: 'text', label: '텍스트 중계' },
  { key: 'lineup', label: '선수 라인업' },
  { key: 'weather', label: '구장날씨' },
];

/**
 * useLiveboardScreen Facade Hook
 *
 * Why: 라이브보드 상세 화면의 복잡한 데이터 패칭, 상태 관리, URL 파라미터 핸들링을
 * 하나의 인터페이스로 통합하여 뷰(app/liveboard/[matchId].tsx)를 단순화함.
 * SSOT 기반의 URL 파라미터 관리와 병렬 데이터 패칭을 보장함.
 */
export const useLiveboardScreen = () => {
  const { myTeam } = useAuth();
  const myTeamCode = myTeam && isValidTeamCode(myTeam) ? myTeam : null;

  // 1. [SSOT] URL 파라미터 추출 및 유효성 검사
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const isValidMatchId = useMemo(
    () => typeof matchId === 'string' && /^\d+$/.test(matchId),
    [matchId],
  );
  const idNum = useMemo(
    () => (isValidMatchId ? parseInt(matchId as string) : 0),
    [isValidMatchId, matchId],
  );

  // 2. [Parallel Fetching] 데이터 병렬 수급
  const {
    data: match,
    isLoading: isMatchLoading,
    isError: isMatchError,
  } = useMatchDetail(isValidMatchId ? idNum : 0, myTeamCode);

  const {
    data: liveData,
    isLoading: isLiveLoading,
    isError: isLiveError,
  } = useLiveboardData(isValidMatchId ? idNum : 0);

  // 3. [Real-time WebSockets & Query Cache Injection]
  const queryClient = useQueryClient();
  const { status: wsStatus, client: wsClient } = useWebSocket(
    isValidMatchId ? idNum : undefined,
    'liveboard',
  );

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    if (wsStatus === 'CONNECTED' && wsClient && isValidMatchId) {
      const destination = `/server/liveboard/room/${idNum}/match`;
      subscription = wsClient.subscribe(destination, (message) => {
        try {
          const rawData = JSON.parse(message.body);
          // Zero Magic: 백엔드 DTO를 프론트엔드 모델 규격으로 매퍼를 거쳐 파싱
          const mappedData = LiveboardMapper.toLiveboardData(rawData);

          // 캐시 강제 주입으로 실시간 동기화 완료 (No HTTP Polling overhead)
          queryClient.setQueryData(['liveboard', 'data', idNum], mappedData);
        } catch (err) {
          liveboardLogger.error('Failed to parse liveboard STOMP message', err);
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [wsStatus, wsClient, idNum, isValidMatchId, queryClient]);

  // 4. UI 상태 관리 (Tabs)
  const [activeTab, setActiveTab] = useState<TabKey>('chat');
  const [visitedTabs, setVisitedTabs] = useState<TabKey[]>(['chat']);

  const handleSetTab = (tab: TabKey) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
  };

  // 5. 통합 로딩/에러 상태
  const isInitialLoading = isMatchLoading && !match;

  return {
    matchId: matchId || '',
    match,
    liveData,
    activeTab,
    visitedTabs,
    setActiveTab: handleSetTab,
    isLoading: {
      match: isMatchLoading,
      live: isLiveLoading,
      initial: isInitialLoading,
    },
    isError: {
      match: isMatchError,
      live: isLiveError,
    },
    isValidMatchId,
    myTeamCode,
  };
};
