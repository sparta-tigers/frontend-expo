# Cascade AI 분석: Phase 1 마이그레이션 문제

## 📋 개요

PWA → Expo 마이그레이션 과정에서 Cascade AI가 발견한 기술적 문제들과 해결 방안입니다.

---

## 🔥 Cascade AI 분석 문제 (2026-01-21 17:15)

### 1. TypeScript 타입 에러 (높음)

#### 문제 상황

- **파일**: `src/hooks/useAuth.ts`
- **에러**: `'ResultType'이(가) 'string'과(와) 겹치지 않으므로 이 비교는 의도하지 않은 것 같습니다.`
- **위치**: 71번 라인, 105번 라인

#### 원인 분석

API 응답의 `resultType`이 `string` 타입으로 추론되어, `ResultType` enum과 비교 시 타입 불일치 발생

#### 해결 방안

1. **API 응답 타입 수정**: `resultType` 필드를 명시적으로 `ResultType`으로 타입 지정
2. **타입 가드 함수 추가**: API 응답 결과 타입 검증 함수 구현
3. **임시 해결**: 문자열 비교로 변경 (권장하지 않음)

---

### 2. WebSocket 호환성 검증 필요 (중간)

#### 문제 상황

- **대상**: STOMP.js WebSocket 연동
- **의문점**: React Native 환경에서의 STOMP.js 호환성 미검증

#### 원인 분석

- PWA 환경에서는 `sockjs-client` + `@stomp/stompjs` 조합 사용
- React Native에서는 WebSocket API 직접 사용 필요 가능성

#### 해결 방안

1. **테스트 코드 작성**: WebSocket 연결 테스트
2. **대안 조사**: React Native WebSocket 라이브러리 조사
3. **백엔드 협의**: WebSocket 연동 방식 확인

---

### 3. 스토리지 보안 문제 (낮음)

#### 문제 상황

- **현재**: AsyncStorage에 JWT 토큰 저장
- **문제**: 민감한 토큰 정보가 일반 스토리지에 저장

#### 원인 분석

- AsyncStorage는 암호화되지 않은 저장소
- 루팅된 기기에서 토큰 유출 가능성

#### 해결 방안

1. **SecureStore 전환**: `expo-secure-store`로 토큰 저장
2. **혼용 방식**: 일반 데이터는 AsyncStorage, 토큰은 SecureStore
3. **암호화**: 직접 암호화 로직 구현 (권장하지 않음)

---

### 4. 토큰 만료 시간 처리 오류 (중간)

#### 문제 상황

- **파일**: `src/hooks/useAuth.ts` - `loadToken` 함수
- **문제**: 만료 시간 정보를 `new Date()`로 강제 생성

#### 원인 분석

```typescript
// 현재 코드 문제
setUser({
  accessToken,
  refreshToken,
  accessTokenIssuedAt: new Date(), // ❌ 실제 만료 시간 무시
  accessTokenExpiredAt: new Date(), // ❌ 현재 시간으로 설정
  // ...
});
```

#### 리스크

- 실제 만료 시간과 상관없이 "싱싱한 토큰"으로 착각
- 서버 요청 시 401 에러로 터짐
- 사용자 경험 저하

---

### 5. Silent Refresh 로직 부재 (중간)

#### 문제 상황

- **파일**: `src/api/index.ts`
- **문제**: 401 에러 시 자동 토큰 갱신 로직 부재

#### 원인 분석

- 액세스 토큰 만료 시 `authRefreshTokenAPI` 자동 호출 필요
- 현재는 수동으로만 토큰 갱신 가능

#### 해결 방안

1. **응답 인터셉터 추가**: 401 에러 감지 시 자동 갱신
2. **재시도 로직**: 갱신 후 원래 요청 재시도
3. **실패 처리**: 리프레시 토큰 만료 시 로그아웃

---

### 6. WebSocket vs HTTP API 불일치 (낮음)

#### 문제 상황

- **파일**: `src/api/chatrooms.ts`
- **문제**: 메시지 전송을 `apiClient.post`로 구현

#### 원인 분석

- 계획서에서는 STOMP(WebSocket) 연동 예정
- 현재는 HTTP API로 메시지 전송

#### 해결 방안

1. **STOMP 클라이언트 구현**: WebSocket 메시지 전송
2. **하이브리드 방식**: HTTP API + WebSocket 병행
3. **명확한 정책**: 메시징 방식 결정 및 문서화

---

## 📝 해결된 문제

### 1. AsyncStorage 의존성 (✅ 해결됨)

- **문제**: localStorage → AsyncStorage 전환 필요
- **해결**: `@react-native-async-storage/async-storage` 설치 완료

### 2. API 클라이언트 환경변수 (✅ 해결됨)

- **문제**: baseURL 하드코딩
- **해결**: `EXPO_PUBLIC_API_BASE_URL` 환경변수 처리

---

## 🚨 긴급 대응 필요

### 1. TypeScript 타입 에러

- **담당자**: Cascade AI
- **예상 시간**: 30분
- **영향도**: 로그인/회원가입 기능 전체

### 2. 토큰 만료 처리 로직

- **담당자**: Cascade AI
- **예상 시간**: 1시간
- **영향도**: 인증 지속성

---

## 📊 문제 통계

| 심각도 | 개수 | 상태      |
| ------ | ---- | --------- |
| 높음   | 1    | 해결 필요 |
| 중간   | 3    | 해결 필요 |
| 낮음   | 2    | 개선 권장 |
| 해결됨 | 2    | ✅ 완료   |

---

## 🔗 관련 문서

- [migration-plan.md](./migration-plan.md) - 전체 마이그레이션 계획
- [project-context.md](./project-context.md) - 현재 진행 상황
- [problems-gemini.md](./problems-gemini.md) - Gemini 코드리뷰

---

_마지막 업데이트: 2026-01-21 17:15_  
_담당자: Cascade AI Assistant_
