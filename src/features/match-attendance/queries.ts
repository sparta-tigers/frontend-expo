import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  lists: () => [...attendanceKeys.all, "list"] as const,
  my: (page?: number, size?: number) => [...attendanceKeys.lists(), "my", { page, size }] as const,
  infinite: (size: number) => [...attendanceKeys.lists(), "infinite", { size }] as const,
  details: () => [...attendanceKeys.all, "detail"] as const,
  detail: (id: number) => [...attendanceKeys.details(), id] as const,
};

/**
 * 내 직관 기록 목록 조회 쿼리
 */
export const useMyAttendances = (page: number = 1, size: number = 100) => {
  return useQuery({
    queryKey: attendanceKeys.my(page, size),
    queryFn: () => attendanceGetMyAPI(page, size),
    select: (response) => response.data?.content ?? [],
  });
};

/**
 * 🚨 [Phase 28] 무한 스크롤 기반 직관 기록 목록 조회
 * Why: 100건 하드코딩 제한을 철폐하고 대용량 데이터를 안전하게 로드함.
 */
export const useInfiniteMyAttendances = (size: number = 10) => {
  return useInfiniteQuery({
    queryKey: attendanceKeys.infinite(size),
    queryFn: ({ pageParam = 0 }) => attendanceGetMyAPI((pageParam as number) + 1, size),
    getNextPageParam: (lastPage) => {
      const data = lastPage.data;
      if (!data || data.last) return undefined;
      return data.number + 1; // number는 0-indexed (Spring Pageable)
    },
    initialPageParam: 0,
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
      // 🚨 목록 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
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
