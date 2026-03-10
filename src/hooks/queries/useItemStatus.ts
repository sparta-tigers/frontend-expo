import { itemsUpdateStatusAPI } from "@/src/features/exchange/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

/**
 * 아이템 상태 변경 훅
 *
 * 작업 지시서 Target 14 구현
 * - 낙관적 업데이트: onMutate로 캐시 즉시 수정
 * - 롤백 로직: onError로 실패 시 원상 복구
 * - 캐시 무효화: 성공/실패 후 관련 QueryKey 무효화
 */
export const useUpdateItemStatus = (itemId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newStatus: string) => itemsUpdateStatusAPI(itemId, newStatus),
    onMutate: async (newStatus) => {
      // 관련 쿼리 취소하여 동시성 문제 방지
      await queryClient.cancelQueries({ queryKey: ["item", itemId] });

      // 이전 데이터 저장 (롤백용)
      const previousItem = queryClient.getQueryData(["item", itemId]);

      // 낙관적 업데이트: UI 즉시 반영
      queryClient.setQueryData(["item", itemId], (old: any) => ({
        ...old,
        status: newStatus,
      }));

      return { previousItem };
    },
    onError: (_, __, context) => {
      // 실패 시 원상 복구
      if (context?.previousItem) {
        queryClient.setQueryData(["item", itemId], context.previousItem);
      }
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    },
    onSettled: () => {
      // 성공/실패 여부와 상관없이 최종적으로 서버 데이터 재동기화
      queryClient.invalidateQueries({ queryKey: ["item", itemId] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["myExchanges"] }); // 마이페이지 관리 내역 동기화
    },
  });
};
