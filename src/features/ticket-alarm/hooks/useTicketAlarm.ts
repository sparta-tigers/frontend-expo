import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ticketAlarmGetListAPI, 
  ticketAlarmCreateAPI, 
  ticketAlarmDeleteAPI, 
  ticketAlarmUpdateAPI 
} from "../api";
import { ticketAlarmKeys } from "../queries";
import { CreateTicketAlarmRequest, UpdateTicketAlarmRequest } from "../types";
import { Logger } from "@/src/utils/logger";

/**
 * 🚨 앙드레 카파시: 티켓 알림 통합 훅
 * 
 * Why: 알림 설정/해제/목록 조회를 하나의 인터페이스로 캡슐화하여 UI 복잡도를 낮춤.
 */

export function useTicketAlarms(page: number = 1, size: number = 20) {
  return useQuery({
    queryKey: ticketAlarmKeys.list(page, size),
    queryFn: () => ticketAlarmGetListAPI(page, size),
    select: (res) => res.data,
  });
}

export function useTicketAlarmMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (request: CreateTicketAlarmRequest) => ticketAlarmCreateAPI(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketAlarmKeys.all });
      Logger.info("Ticket alarm created successfully");
    },
    onError: (error) => {
      Logger.error("Failed to create ticket alarm", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (alarmId: number) => ticketAlarmDeleteAPI(alarmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketAlarmKeys.all });
      Logger.info("Ticket alarm deleted successfully");
    },
    onError: (error) => {
      Logger.error("Failed to delete ticket alarm", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ alarmId, request }: { alarmId: number; request: UpdateTicketAlarmRequest }) => 
      ticketAlarmUpdateAPI(alarmId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketAlarmKeys.all });
      Logger.info("Ticket alarm updated successfully");
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
