import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  attendanceGetMyAPI, 
  attendanceCreateAPI, 
  attendanceUpdateAPI,
  attendanceDeleteAPI,
  attendanceGetDetailAPI
} from "./api";

/**
 * 🚨 앙드레 카파시: 직관 기록 관련 TanStack Query 훅 모음
 * 
 * Why: 서버 상태를 캐싱하고, 데이터 변경 시 관련 쿼리를 자동으로 무효화(Invalidation)하여 
 * UI 정합성을 유지함. (Zero-Magic UI의 핵심)
 */

export const attendanceKeys = {
  all: ["attendances"] as const,
  my: () => [...attendanceKeys.all, "my"] as const,
  detail: (id: number) => [...attendanceKeys.all, "detail", id] as const,
};

/**
 * 내 직관 기록 목록 조회 쿼리
 */
export const useMyAttendances = (page: number = 1, size: number = 100) => {
  return useQuery({
    queryKey: [...attendanceKeys.my(), page, size], // 🚨 페이지 번호/사이즈를 키에 포함하여 캐시 파편화 방지
    queryFn: () => attendanceGetMyAPI(page, size),
    select: (response) => response.data?.content ?? [],
  });
};

/**
 * 직관 기록 단건 조회 쿼리
 */
export const useAttendance = (id: number) => {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => attendanceGetDetailAPI(id),
    select: (response) => response.data,
    enabled: !!id && !isNaN(id), // 🚨 NaN 체크 추가 (Fail-fast)
  });
};

/**
 * 직관 기록 생성 뮤테이션
 */
export const useCreateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => attendanceCreateAPI(formData),
    onSuccess: () => {
      // 🚨 목록 쿼리만 정밀 무효화 (all 사용 시 모든 캐시가 날아감)
      queryClient.invalidateQueries({ queryKey: attendanceKeys.my() });
    },
  });
};

/**
 * 직관 기록 수정 뮤테이션
 */
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => 
      attendanceUpdateAPI(id, formData),
    onSuccess: (_, variables) => {
      // 🚨 수정된 항목의 상세 캐시와 목록 캐시만 무효화
      queryClient.invalidateQueries({ queryKey: attendanceKeys.my() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.detail(variables.id) });
    },
  });
};

/**
 * 직관 기록 삭제 뮤테이션
 */
export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => attendanceDeleteAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
};
