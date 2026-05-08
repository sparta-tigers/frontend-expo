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
