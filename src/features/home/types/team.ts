// src/features/home/types/team.ts
import { TeamMeta } from "@/src/utils/team";

/**
 * 팀(구단) 정보 데이터 모델
 *
 * Why: TeamMeta를 기반으로 하되, 하위 호환성을 위해 TeamDto라는 이름을 유지함.
 * 아키텍처 가이드에 따라 TeamMeta가 SSOT가 된다.
 */
export type TeamDto = TeamMeta;
