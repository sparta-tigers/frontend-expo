/**
 * 🚨 앙드레 카파시: 티켓 알림 쿼리 키 팩토리 및 쿼리 정의
 * 
 * Why: 쿼리 키를 계층화하여 오타 방지 및 효율적인 캐시 무효화를 실현함.
 */

/**
 * 🔑 ticketAlarmKeys: 티켓 알림 도메인의 모든 쿼리 키를 중앙 관리하는 팩토리입니다.
 * 
 * Why: 문자열 기반의 키 관리로 인한 오타(Cache Miss)를 방지하고, 계층적 구조(`all` -> `lists` -> `list`)를 형성하여 
 * 필요 시 특정 범위의 캐시만 정교하게 무효화(Invalidate)하거나 전체 알림 상태를 한 번에 갱신하기 위함입니다.
 */
export const ticketAlarmKeys = {
  /** 알림 도메인 전체를 아우르는 최상위 루트 키 */
  all: ["ticketAlarm"] as const,

  /** 📑 lists: 페이징이 적용된 알림 목록의 기본 식별자 */
  lists: () => [...ticketAlarmKeys.all, "list"] as const,

  /** 🔍 list: 페이지 번호와 사이즈별로 구체화된 목록 식별자 */
  list: (page: number, size: number) => [...ticketAlarmKeys.lists(), { page, size }] as const,
};
