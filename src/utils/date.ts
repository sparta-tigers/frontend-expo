/**
 * 결정론적 날짜 유틸리티
 * 
 * Why: 컴포넌트 내부에서 new Date()를 호출하는 비결정론적 행위를 방지하고, 
 * 일관된 포맷(yyyyMMdd)의 날짜 데이터를 제공하기 위함.
 */

/**
 * 현재 날짜를 yyyyMMdd 형식의 문자열로 반환합니다.
 */
export const getTodayString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * 현재 연도를 반환합니다.
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * 현재 월을 반환합니다. (1-indexed)
 */
export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1;
};

/**
 * 현재 일을 반환합니다.
 */
export const getCurrentDay = (): number => {
  return new Date().getDate();
};

/**
 * 특정 연월로부터 N개월 전/후의 연월을 반환합니다.
 */
export const getRelativeMonth = (year: number, month: number, offset: number) => {
  const date = new Date(year, month - 1 + offset, 1);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
};

/**
 * 날짜와 요일을 한국어로 포맷팅합니다.
 * @param dateStr ISO 날짜 문자열
 * @param includeYear 연도 포함 여부
 */
export const formatToKoreanDateTime = (dateStr: string, includeYear = true): string => {
  const date = new Date(dateStr);
  
  // 🚨 [Safety] Invalid Date 체크
  if (isNaN(date.getTime())) {
    return "알 수 없는 날짜";
  }

  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return includeYear 
    ? `${year}년 ${month}월 ${day}일(${dayOfWeek}) ${hours}:${minutes}`
    : `${month}월 ${day}일(${dayOfWeek}) ${hours}:${minutes}`;
};
