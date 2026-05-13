/**
 * 🚨 앙드레 카파시: 티켓 알림 쿼리 키 팩토리 및 쿼리 정의
 * 
 * Why: 쿼리 키를 계층화하여 오타 방지 및 효율적인 캐시 무효화를 실현함.
 */

export const ticketAlarmKeys = {
  all: ["ticketAlarm"] as const,
  lists: () => [...ticketAlarmKeys.all, "list"] as const,
  list: (page: number, size: number) => [...ticketAlarmKeys.lists(), { page, size }] as const,
};
