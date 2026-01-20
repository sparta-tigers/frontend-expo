# 프로젝트 컨텍스트 기록

## 📋 개요

본 문서는 PWA → Expo 마이그레이션 진행 상황을 실시간으로 기록하고 팀원 간 컨텍스트를 공유하기 위한 living document입니다.

---

## 🎯 현재 상태 (2026-01-21 00:35)

### ✅ 완료된 작업

- **프로젝트 초기 설정**: Expo SDK 54 기반
- **환경 설정**: Node.js v24.8.0, npm 11.6.0
- **문서화**: migration-plan.md, expo-setup-guide.md 완성
- **팀 규칙**: .windsurfrules 정의
- **Git 초기화**: 첫 커밋 완료 (05d05b3)

### ⏳ 진행 중인 작업

- **Phase 1**: 기본 설정 단계 시작 준비
- **코드 분석**: PWA 구조 파악 완료
- **API 설계**: 호환성 평가 완료

### ❌ 미완료 작업

- **PWA 코드 이전**: 실제 비즈니스 로직 이전 필요
- **UI 컴포넌트**: 39개 Radix UI → 네이티브 전환
- **API 클라이언트**: Axios, STOMP 설정 이전
- **네비게이션**: React Router → React Navigation 전환

---

## 📊 마이그레이션 현황

### Phase 1: 기본 설정 (1주 예상)

- [x] Expo 프로젝트 생성
- [x] TypeScript 환경 구성
- [ ] 네비게이션 구조 설계 (React Navigation)
- [ ] API 클라이언트 이전 (Axios, STOMP)

### Phase 2: 핵심 기능 이전 (2-3주 예상)

- [ ] 인증 시스템 (로그인/회원가입)
- [ ] 사용자 정보 관리
- [ ] 채팅 기능 (WebSocket 연동)
- [ ] 아이템 목록/상세 보기

### Phase 3: UI 컴포넌트 재구현 (3-4주 예상)

- [ ] 기본 UI 컴포넌트 라이브러리 구축
- [ ] Radix UI → 네이티브 컴포넌트 전환
- [ ] 도메인별 페이지 재구현
- [ ] 반응형 디자인 적용

---

## 🔧 기술적 의사결정 기록

### 2026-01-21 00:35

1. **Expo CLI 방식**: 레거시 expo-cli 제거, npx 방식 채택
   - 이유: Node.js 17+ 호환성 문제
   - 결정: 새로운 Expo CLI 사용 (npx expo)

2. **TypeScript 설정**: 엄격 모드 유지
   - 이유: .windsurfrules의 No any Policy 준수
   - 설정: `"strict": true`, `"noImplicitAny": true`

3. **API 클라이언트 방식**: Axios 그대로 사용 결정
   - 이유: migration-plan.md 호환성 평가 결과
   - 계획: 인터셉터만 Expo 환경에 맞게 수정

---

## 🚨 현재 이슈사항

### 해결 필요

- **PWA 코드 이전**: 실제 구현 코드가 거의 없음
- **API 클라이언트**: src/api/index.ts 파일이 비어있음
- **타입 정의**: PWA의 전체 인터페이스가 이전되지 않음

### 예상 이슈

- **Radix UI 의존성**: 39개 컴포넌트 재구현 작업량
- **WebSocket 연동**: STOMP.js 호환성 검증 필요
- **스토리지**: localStorage → AsyncStorage/SecureStore 전환

---

## 📝 다음 작업 계획

### 즉시 실행 (오늘)

1. **API 클라이언트 구현**: src/api/index.ts 완성
2. **타입 정의 이전**: PWA의 전체 인터페이스 복사
3. **인증 API 구현**: auth.ts 완성 및 테스트

### 단기 계획 (이번 주)

1. **React Navigation 설정**: 기본 네비게이션 구조
2. **인증 화면**: 로그인/회원가입 페이지
3. **API 연동 테스트**: 백엔드와 통신 검증

---

## 💡 팀원 참고사항

### 개발 환경

- **Node.js**: v24.8.0 (최신)
- **Expo**: SDK 54.0.21
- **TypeScript**: 엄격 모드
- **명령어**: `npx expo start` 사용

### 코드 규칙

- **언어**: TypeScript만 (.ts, .tsx)
- **any 타입**: 절대 금지
- **주석**: Javadoc 스타일, 한국어 설명
- **커밋**: 한글, [TAG] 제목 형식

### 백엔드 연동

- **API 기본주소**: migration-plan.md 참조
- **인증 방식**: JWT Bearer 토큰
- **WebSocket**: STOMP.js 그대로 사용 가능

---

## 🔗 관련 문서 링크

- [migration-plan.md](./migration-plan.md) - 전체 마이그레이션 계획
- [expo-setup-guide.md](./expo-setup-guide.md) - 개발 환경 설정 가이드
- [.windsurfrules](./.windsurfrules) - 팀 개발 규칙

---

_마지막 업데이트: 2026-01-21 00:35_  
_담당자: Cascade AI Assistant_
