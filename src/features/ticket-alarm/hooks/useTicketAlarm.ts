import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ticketAlarmGetListAPI, 
  ticketAlarmCreateAPI, 
  ticketAlarmDeleteAPI, 
  ticketAlarmUpdateAPI,
  ticketAlarmGetCountAPI
} from "../api";
import { ticketAlarmKeys } from "../queries";
import { CreateTicketAlarmRequest, UpdateTicketAlarmRequest } from "../types";
import { Logger } from "@/src/utils/logger";

/**
 * 🚨 앙드레 카파시: 티켓 알림 통합 훅
 * 
 * Why: 알림 설정/해제/목록 조회를 하나의 인터페이스로 캡슐화하여 UI 복잡도를 낮춤.
 */

/**
 * 🎣 useTicketAlarms: 사용자의 티켓 알림 목록을 관리하는 커스텀 훅입니다.
 * 
 * Why: 서버의 페이징 데이터를 React 상태와 동기화하고, TanStack Query의 캐싱 기능을 활용하여 
 * 동일 데이터에 대한 중복 네트워크 요청을 차단하기 위함입니다. 
 * select 가공을 통해 UI 컴포넌트가 API 응답 구조에 의존하지 않고 데이터 본체만 깔끔하게 참조하도록 설계했습니다.
 */
export function useTicketAlarms(page: number = 1, size: number = 20) {
  return useQuery({
    queryKey: ticketAlarmKeys.list(page, size),
    queryFn: () => ticketAlarmGetListAPI(page, size),
    select: (res) => res.data,
  });
}

/**
 * 🔢 useTicketAlarmCount: 사용자의 전체 티켓 알림 개수를 조회하는 훅입니다.
 * 
 * Why: 대시보드 상단 섹션 등 요약 UI에서 실제 데이터 기반의 카운트를 보여주기 위함입니다.
 */
export function useTicketAlarmCount() {
  return useQuery({
    queryKey: ticketAlarmKeys.count(),
    queryFn: ticketAlarmGetCountAPI,
    select: (res) => res.data ?? 0,
  });
}

/**
 * 🏗 useTicketAlarmMutation: 알림의 생성, 수정, 삭제(CUD) 작업을 통합 관리하는 뮤테이션 훅입니다.
 * 
 * Why: 데이터 변경(Mutation) 후 서버 상태와 로컬 캐시 간의 불일치를 해결하기 위해 
 * `onSuccess` 시점에서 `ticketAlarmKeys.all`을 무효화(Invalidate)하는 전략을 중앙 집중화합니다. 
 * 이를 통해 목록 UI와 캘린더 등 알림 상태를 참조하는 모든 컴포넌트가 최신 데이터를 즉각 반영하도록 보장합니다.
 */
export function useTicketAlarmMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (request: CreateTicketAlarmRequest) => ticketAlarmCreateAPI(request),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ticketAlarmKeys.all });
    },
    onError: (error) => {
      Logger.error("Failed to create ticket alarm", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (alarmId: number) => ticketAlarmDeleteAPI(alarmId),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ticketAlarmKeys.all });
    },
    onError: (error) => {
      Logger.error("Failed to delete ticket alarm", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ alarmId, request }: { alarmId: number; request: UpdateTicketAlarmRequest }) => 
      ticketAlarmUpdateAPI(alarmId, request),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ticketAlarmKeys.all });
    },
    onError: (error) => {
      Logger.error("Failed to update ticket alarm", error);
    },
  });

  return {
    createAlarm: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteAlarm: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateAlarm: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
