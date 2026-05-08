import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "../api";
import { useAuth } from "@/context/AuthContext";

/**
 * 홈 대시보드 요약 데이터를 가져오는 커스텀 훅
 * 
 * Why: 로그인 상태(isLoggedIn)가 활성(true)일 때만 API를 호출하도록 enabled 옵션을 설정하여, 
 * 비로그인 사용자(게스트)에게 불필요한 401 Unauthorized 에러가 발생하는 것을 방지합니다.
 */
export const useDashboardSummary = () => {
  const { isLoggedIn } = useAuth();

  return useQuery({
    queryKey: ["home", "dashboard", "summary"],
    queryFn: fetchDashboardSummary,
    enabled: isLoggedIn, // 🚨 로그인 상태일 때만 쿼리 활성화
    staleTime: 1000 * 60 * 5, // 5분간 데이터 유지
  });
};
