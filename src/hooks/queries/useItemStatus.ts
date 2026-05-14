import { Item } from "@/src/features/exchange/items";
import { itemsUpdateStatusAPI } from "@/src/features/exchange/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

/**
 * 아이템 상태 변경 훅
 *
 * Why: 중고 거래/교환 프로세스에서 아이템의 상태(판매중, 예약중, 완료)를 변경할 때,
 * 사용자에게 즉각적인 피드백을 제공하기 위해 '낙관적 업데이트' 전략을 사용한다.
 * 
 * [Zero Magic & Deterministic State]
 * 1. onMutate: 서버 응답 전 캐시를 즉시 수정하여 UI 반응 속도 극대화.
 * 2. onError: 실패 시 이전 데이터로 롤백하여 데이터 정합성 유지.
 * 3. onSettled: 최종적으로 서버와 동기화하여 잠재적인 캐시 불일치 방지.
 */
export const useUpdateItemStatus = (itemId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newStatus: string) => itemsUpdateStatusAPI(itemId, newStatus),
    onMutate: async (newStatus) => {
      // 관련 쿼리 취소하여 동시성 문제 방지
      await queryClient.cancelQueries({ queryKey: ["item", itemId] });

      // 이전 데이터 저장 (롤백용)
      const previousItem = queryClient.getQueryData<Item>(["item", itemId]);

      // 낙관적 업데이트: UI 즉시 반영
      queryClient.setQueryData(["item", itemId], (old: Item | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: newStatus,
        };
      });

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
      // [Zero Magic] 성공/실패 여부와 상관없이 최종적으로 서버 데이터와 캐시를 동기화함.
      // 프로미스를 반환하여 무효화가 완료될 때까지 뮤테이션을 'settling' 상태로 유지.
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["item", itemId] }),
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        queryClient.invalidateQueries({ queryKey: ["myExchanges"] }),
      ]);
    },
  });
};
