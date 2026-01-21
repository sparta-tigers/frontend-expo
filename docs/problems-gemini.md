# Phase 1 마이그레이션 전체 리뷰: "기초 골조는 합격, 보안 마감은 불합격"

## 1. 보안 리스크 (Critical Warning 🚨)

- AsyncStorage 사용 문제: 계획서와 가이드에서는 민감 데이터를 SecureStore로 옮긴다고 했지만, 현재 index.ts와 useAuth.ts는 모두 AsyncStorage를 사용하고 있어요.
- 위험 요인: AsyncStorage는 암호화되지 않은 평문 저장소예요. 탈옥된 기기나 특정 접근 권한이 있으면 JWT 토큰이 그대로 노출됩니다.
  - 자바 백엔드 개발자로서 보안을 중요하게 생각하신다면, 당장 expo-secure-store로 교체해야 해요.

## 2. 아키텍처 및 정합성 (Good Points)

- ApiResponse 표준화: `ApiResponse<T>` 구조가 Spring Boot의 표준 응답 객체와 완벽히 일치해요. 제네릭(T)을 활용해 타입 안정성을 확보한 점은 아주 좋습니다.
- 도메인 분리: t\_ 접두사를 활용해 타입 정의(DTO)와 API 로직을 분리한 덕분에, 나중에 백엔드 엔티티가 변경되어도 프론트엔드 대응이 매우 수월한 구조입니다.
- Axios 인터셉터: 요청 시 비동기로 토큰을 꺼내 Authorization 헤더에 삽입하는 로직이 정확히 구현되었어요.

## 3. 로직 결함 (Devil's Advocate - "악마의 변호인")

- 임의의 토큰 복원 (useAuth.ts): loadToken 함수에서 저장된 토큰을 읽어올 때, 만료 시간 정보를 강제로 new Date()로 생성해서 넣고 있어요.
  - 리스크: 실제 만료 시간과 상관없이 클라이언트는 "지금 막 발급된 싱싱한 토큰"이라고 착각하게 됩니다. 결국 서버에 요청을 보냈을 때야 401 에러를 받고 터지는 구조라, 사용자 경험이 좋지 않아요.
- 401 인터셉터 부재: 액세스 토큰이 만료되었을 때 authRefreshTokenAPI를 자동으로 호출해서 토큰을 갱신하는 Silent Refresh 로직이 index.ts에 빠져 있습니다.
- STOMP 불일치: chatrooms.ts에서 메시지 전송이 apiClient.post로 구현되어 있는데, 이는 계획서의 STOMP(WebSocket) 연동 계획과 충돌할 수 있습니다.

## 4. 도메인별 디테일

Items: 하위 호환성을 위해 nickname과 userNickname을 모두 인터페이스에 담아둔 건 실무적인 센스가 돋보이는 부분이에요.
Exchanges: Java의 Enum을 Union Type으로 정의하여 타입 체크를 엄격하게 한 점이 인상적입니다.
