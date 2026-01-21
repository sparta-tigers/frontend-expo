# PWA → Expo Migration Plan

## 📋 개요

본 문서는 기존 PWA 기반 React 앱을 Expo + React Native 환경으로 전환하기 위한 마이그레이션 계획입니다. 백엔드 API는 유지하되, 프론트엔드 기술 스택을 네이티브 환경으로 전환하는 것을 목표로 합니다.

## 🎯 전환 목표

- **기존**: Vite + React 19 + TypeScript + PWA
- **목표**: Expo + React Native + TypeScript
- **유지**: 백엔드 API 연동, 비즈니스 로직, TypeScript 타입 시스템

---

## 0. 기존 시스템 구조 분석

### 0.1 PWA 프론트엔드 상세 구조

#### 기술 스택

- React 19 + TypeScript + Vite
- Radix UI (39개 컴포넌트) + TailwindCSS
- React Router 7 + Axios + STOMP.js

#### 디렉토리 구조

```text
src/
├── components/
│   ├── ui/ (39개 Radix UI 컴포넌트)
│   │   ├── button.tsx, dialog.tsx, dropdown-menu.tsx
│   │   ├── tabs.tsx, select.tsx, checkbox.tsx
│   │   └── ... (고급 UI 컴포넌트)
│   ├── liveboard/ (13개 라이브보드 컴포넌트)
│   │   ├── ScoreBoard.tsx, MatchItem.tsx, Players.tsx
│   │   └── ... (경기 관련 컴포넌트)
│   └── shared/ (공용 컴포넌트)
│       └── ChatMessage.tsx
├── routes/pages/ (13개 페이지)
│   ├── LiveBoardMainPage.tsx, LiveBoardRoomPage.tsx
│   ├── ChatRoomsPage.tsx, ChatroomPage.tsx
│   ├── ExchangeMainPage.tsx, CreateExchangePage.tsx
│   └── ... (도메인별 페이지)
├── api/ (API 클라이언트 + 타입 정의)
│   ├── index.ts (Axios 클라이언트)
│   ├── auth.ts, chatrooms.ts, exchanges.ts
│   └── type/ (TypeScript 인터페이스)
└── hooks/ (커스텀 훅)
    ├── use-mobile.ts
    └── exchange/, liveboard/, users/
```

### 0.2 백엔드 Spring Boot 구조

#### 도메인 기반 아키텍처

```text
src/main/java/com/sparta/spartatigers/
├── domain/
│   ├── auth/ (JWT 인증)
│   ├── user/ (사용자 관리)
│   ├── item/ (아이템 관리)
│   ├── exchangerequest/ (교환 요청)
│   ├── directRoom/ (채팅방)
│   ├── stompchat/ (WebSocket)
│   └── liveboardroom/ (라이브보드)
└── global/ (공통 설정)
```

#### API 설계 패턴

- 표준화된 `ApiResponse<T>` 응답 구조
- JWT Bearer 인증 (Authorization 헤더)
- 페이징 처리 (`PageInfo` 인터페이스)

### 0.3 데이터 흐름 분석

#### 인증 흐름

```text
POST /api/v1/auth/login → JWT 토큰 → localStorage 저장
→ API 요청 시 자동 Bearer 토큰 헤더 추가
```

#### 채팅 흐름

```text
SockJS + STOMP.js → WebSocket 연결 (/ws)
→ 실시간 메시지 교환 (ChatMessageData)
→ 채팅방 생성 (DirectRoom)
```

#### 교환 흐름

```text
아이템 목록 → 교환 신청 (ExchangeRequest)
→ 채팅방 자동 생성 → 실시간 협상
→ 교환 완료 처리
```

### 0.4 호환성 평가

| 구분        | 호환성  | 마이그레이션 방식               | 비고                            | 리스크            |
| ----------- | ------- | ------------------------------- | ------------------------------- | ----------------- |
| API 통신    | ✅ 높음 | Axios 그대로 사용               | baseURL, timeout 동일           | 인증 헤더 필수    |
| WebSocket   | ✅ 높음 | STOMP.js 그대로 사용            | SockJS → React Native WebSocket | ChatDomain 불일치 |
| 인증 토큰   | ⚠️ 중간 | localStorage → AsyncStorage     | SecureStore로 민감 데이터 이전  | 토큰 키 혼재      |
| 라우팅      | ❌ 낮음 | React Router → React Navigation | 네이티브 네비게이션 패턴        | -                 |
| UI 컴포넌트 | ❌ 낮음 | 완전 재구현                     | Radix UI → 네이티브 컴포넌트    | -                 |
| 스타일링    | ❌ 낮음 | TailwindCSS → StyleSheet        | Flexbox 중심으로 재설계         | -                 |

---

## 1. 기존 React 컴포넌트 → Expo 컴포넌트 매핑

### 1.1 UI 기본 컴포넌트 (46개)

| 기존 Web 컴포넌트 | Expo/React Native 대체         | 라이브러리                              | 비고             |
| ----------------- | ------------------------------ | --------------------------------------- | ---------------- |
| `div`, `span`     | `View`, `Text`                 | React Native                            | 기본 컨테이너    |
| `button`          | `TouchableOpacity`, `Button`   | React Native                            | 터치 이벤트 처리 |
| `input`           | `TextInput`                    | React Native                            | 텍스트 입력      |
| `img`             | `Image`                        | React Native                            | 이미지 표시      |
| `ul`, `li`        | `FlatList`, `ScrollView`       | React Native                            | 리스트 렌더링    |
| `a`               | `TouchableOpacity` + `Linking` | React Native                            | 외부 링크        |
| `form`            | `KeyboardAwareScrollView`      | react-native-keyboard-aware-scroll-view | 폼 처리          |

### 1.2 Radix UI → React Native 대체

| Radix UI 컴포넌트               | Expo 대체 컴포넌트       | 라이브러리                            | 구현 난이도 |
| ------------------------------- | ------------------------ | ------------------------------------- | ----------- |
| `@radix-ui/react-dialog`        | `Modal`                  | React Native                          | 중간        |
| `@radix-ui/react-dropdown-menu` | `ActionSheetIOS`, `Menu` | @react-native-menu/menu               | 높음        |
| `@radix-ui/react-tabs`          | `TabView`                | react-native-tab-view                 | 중간        |
| `@radix-ui/react-select`        | `Picker`                 | @react-native-picker/picker           | 중간        |
| `@radix-ui/react-checkbox`      | `CheckBox`               | @react-native-community/checkbox      | 낮음        |
| `@radix-ui/react-switch`        | `Switch`                 | React Native                          | 낮음        |
| `@radix-ui/react-slider`        | `Slider`                 | @react-native-community/slider        | 낮음        |
| `@radix-ui/react-progress`      | `ProgressView`           | @react-native-community/progress-view | 낮음        |

### 1.3 도메인별 컴포넌트 매핑

#### 라이브보드 (13개 컴포넌트)

| 기존 컴포넌트       | Expo 대체                            | 특이사항                 |
| ------------------- | ------------------------------------ | ------------------------ |
| `LiveBoardMainPage` | `LiveBoardMainScreen`                | 네이티브 리스트로 재구현 |
| `LiveBoardRoomPage` | `LiveBoardRoomScreen`                | WebSocket 연동 유지      |
| `MessageList`       | `FlatList`                           | 메시지 렌더링 최적화     |
| `MessageInput`      | `TextInput` + `KeyboardAvoidingView` | 키보드 처리              |

#### 채팅 관련

| 기존 컴포넌트   | Expo 대체         | 특이사항         |
| --------------- | ----------------- | ---------------- |
| `ChatRoomsPage` | `ChatRoomsScreen` | 네이티브 리스트  |
| `ChatroomPage`  | `ChatroomScreen`  | STOMP 연동 유지  |
| `MessageBubble` | `View` + `Text`   | 말풍선 UI 재구현 |

#### 교환 관련

| 기존 컴포넌트        | Expo 대체              | 특이사항         |
| -------------------- | ---------------------- | ---------------- |
| `ExchangeMainPage`   | `ExchangeMainScreen`   | 이미지 그리드 뷰 |
| `ItemDetailPage`     | `ItemDetailScreen`     | 이미지 캐러셀    |
| `CreateExchangePage` | `CreateExchangeScreen` | 카메라 연동 필요 |

---

## 2. Web API → Expo SDK 대체 목록

### 2.1 스토리지 관리

| Web API          | Expo SDK            | 설명             | 마이그레이션 코드                      |
| ---------------- | ------------------- | ---------------- | -------------------------------------- |
| `localStorage`   | `expo-secure-store` | 민감 데이터 저장 | `SecureStore.setItemAsync(key, value)` |
| `localStorage`   | `AsyncStorage`      | 일반 데이터 저장 | `AsyncStorage.setItem(key, value)`     |
| `sessionStorage` | `AsyncStorage`      | 세션 데이터      | `AsyncStorage.setItem(key, value)`     |

### 2.2 네트워크 통신

| Web API          | Expo SDK                | 설명           | 호환성              |
| ---------------- | ----------------------- | -------------- | ------------------- |
| `fetch`, `axios` | `axios` (동일)          | HTTP 통신      | ✅ 그대로 사용 가능 |
| `WebSocket`      | `@stomp/stompjs` (동일) | WebSocket 통신 | ✅ 그대로 사용 가능 |
| `FormData`       | `FormData` (동일)       | 파일 업로드    | ✅ 그대로 사용 가능 |

### 2.3 파일 및 미디어

| Web API                  | Expo SDK            | 설명          | 사용 예시                               |
| ------------------------ | ------------------- | ------------- | --------------------------------------- |
| `File`, `FileReader`     | `expo-file-system`  | 파일 시스템   | `FileSystem.readAsStringAsync(uri)`     |
| `URL.createObjectURL`    | `expo-file-system`  | 파일 URI 처리 | `FileSystem.getContentUriAsync(id)`     |
| `navigator.camera`       | `expo-camera`       | 카메라 접근   | `Camera.launchCameraAsync()`            |
| `navigator.mediaDevices` | `expo-image-picker` | 이미지 선택   | `ImagePicker.launchImageLibraryAsync()` |

### 2.4 푸시 알림

| Web API               | Expo SDK             | 설명      | 설정                                        |
| --------------------- | -------------------- | --------- | ------------------------------------------- |
| `Service Worker` Push | `expo-notifications` | 푸시 알림 | `Notifications.scheduleNotificationAsync()` |
| `Notification API`    | `expo-notifications` | 로컬 알림 | `Notifications.presentNotificationAsync()`  |

### 2.5 위치 및 지도

| Web API                 | Expo SDK            | 설명      | 비고                 |
| ----------------------- | ------------------- | --------- | -------------------- |
| `navigator.geolocation` | `expo-location`     | 위치 정보 | 권한 필요            |
| `카카오맵 SDK`          | `react-native-maps` | 지도 표시 | 커스텀 오버레이 필요 |

### 2.6 디바이스 기능

| Web API           | Expo SDK              | 설명        | 우선순위 |
| ----------------- | --------------------- | ----------- | -------- |
| `navigator.share` | `expo-sharing`        | 공유 기능   | 중간     |
| `window.open`     | `Linking.openURL`     | 외부 링크   | 높음     |
| `document.title`  | `expo-navigation-bar` | 상태바 제어 | 낮음     |

---

## 3. 백엔드 API 엔드포인트 유지 현황

### 3.1 ✅ 유지 가능한 API (기존과 동일)

| 도메인     | 엔드포인트                            | 설명        | 비고                |
| ---------- | ------------------------------------- | ----------- | ------------------- |
| **인증**   | `POST /api/v1/auth/login`             | 로그인      | JWT 토큰 방식 동일  |
| **사용자** | `GET /api/v1/users/me`                | 사용자 정보 | 인증 헤더 동일      |
| **아이템** | `GET /api/v1/items`                   | 아이템 목록 | 페이징 동일         |
| **교환**   | `POST /api/v1/exchanges`              | 교환 신청   | 비즈니스 로직 동일  |
| **채팅방** | `GET /api/direct-rooms`               | 채팅방 목록 | WebSocket 연동 동일 |
| **메시지** | `GET /api/direct-rooms/{id}/messages` | 메시지 목록 | STOMP 프로토콜 동일 |

### 3.2 ⚠️ 수정 필요한 API

| 도메인     | 엔드포인트                    | 수정 사항        | 이유                           | 우선순위 |
| ---------- | ----------------------------- | ---------------- | ------------------------------ | -------- |
| **아이템** | `POST /api/v1/items`          | 파일 업로드 방식 | FormData → multipart/form-data | 높음     |
| **프로필** | `PATCH /api/v1/users/profile` | 이미지 처리      | 네이티브 파일 시스템 연동      | 중간     |
| **알림**   | `GET /api/v1/alarms`          | 푸시 토큰 전달   | FCM → Expo Push Token          | 중간     |
| **인증**   | `POST /api/v1/auth/refresh`   | 재발급 API 확정  | Silent Refresh 구현 필요       | 🔥 긴급  |

### 3.3 🔧 추가 개발 필요한 API

| 도메인         | 필요 기능       | 백엔드 수정 여부 | 우선순위 |
| -------------- | --------------- | ---------------- | -------- |
| **알림**       | 푸시 알림 설정  | ✅ 이미 존재     | 🔥 높음  |
| **즐겨찾기**   | 팀 관리         | ✅ 이미 존재     | 📋 중간  |
| **라이브보드** | 실시간 업데이트 | ✅ 이미 존재     | 📋 중간  |

---

## 4. 마이그레이션 단계별 계획

### Phase 1: 기본 설정 (1주)

- [ ] Expo 프로젝트 생성 및 기본 설정
- [ ] TypeScript 환경 구성
- [ ] 네비게이션 구조 설계 (React Navigation)
- [ ] API 클라이언트 이전 (Axios, STOMP)

### Phase 2: 핵심 기능 이전 (2-3주)

- [ ] 인증 시스템 (로그인/회원가입)
- [ ] 사용자 정보 관리
- [ ] 채팅 기능 (WebSocket 연동)
- [ ] 아이템 목록/상세 보기

### Phase 3: UI 컴포넌트 재구현 (3-4주)

- [ ] 기본 UI 컴포넌트 라이브러리 구축
- [ ] Radix UI → 네이티브 컴포넌트 전환
- [ ] 도메인별 페이지 재구현
- [ ] 반응형 디자인 적용

### Phase 4: 네이티브 기능 연동 (2주)

- [ ] 푸시 알림 (Expo Notifications)
- [ ] 카메라/갤러리 (Expo Image Picker)
- [ ] 파일 업로드 기능 수정
- [ ] 위치 정보 (Expo Location)

### Phase 5: 테스트 및 최적화 (1주)

- [ ] 성능 최적화
- [ ] 메모리 누수 확인
- [ ] 에러 핸들링
- [ ] 사용자 테스트

---

## 5. 기술적 리스크 및 대응책

### 5.1 높은 리스크

| 리스크                | 영향도 | 대응책                          | 우선순위 |
| --------------------- | ------ | ------------------------------- | -------- |
| Radix UI 의존성       | 높음   | 네이티브 컴포넌트로 완전 재구현 | 중간     |
| PWA 기능 손실         | 중간   | 네이티브 기능으로 대체          | 낮음     |
| 성능 저하             | 중간   | FlatList 최적화, 메모리 관리    | 중간     |
| **인증 헤더 필수**    | 높음   | 모든 API 요청에 Bearer 토큰     | 🔥 긴급  |
| **토큰 저장 키 혼재** | 높음   | 단일 키 전략으로 통일           | 🔥 긴급  |
| **CORS 설정**         | 중간   | Expo 개발 환경 origin 허용      | 높음     |

### 5.2 중간 리스크

| 리스크                   | 영향도 | 대응책                        | 우선순위 |
| ------------------------ | ------ | ----------------------------- | -------- |
| WebSocket 연동           | 중간   | STOMP.js 그대로 사용 가능     | 중간     |
| 파일 업로드              | 중간   | Expo FileSystem + FormData    | 높음     |
| 푸시 알림                | 중간   | Expo Notifications + FCM 연동 | 중간     |
| **ChatDomain 값 불일치** | 중간   | 백엔드 처리 범위 확정         | 높음     |
| **Refresh API 부재**     | 높음   | 백엔드 재발급 엔드포인트 확정 | 🔥 긴급  |
| **senderId 하드코딩**    | 중간   | currentUser 기반으로 전환     | 중간     |

---

## 6. 개발 우선순위

### 🔥 긴급 (1-2주)

1. **인증 시스템**: 로그인/회원가입 기능
2. **기본 네비게이션**: 화면 전환 구조
3. **API 연동**: 핵심 엔드포인트 연결

### 📋 중요 (3-4주)

1. **채팅 기능**: 실시간 메시징
2. **아이템 교환**: 핵심 비즈니스 로직
3. **UI 컴포넌트**: 기본 컴포넌트 라이브러리

### 🔧 보통 (5-6주)

1. **푸시 알림**: 알림 시스템
2. **파일 업로드**: 이미지 처리
3. **라이브보드**: 실시간 업데이트

---

## 7. 성공 지표

### 기술적 지표

- [ ] API 응답 시간: 500ms 이하 유지
- [ ] 앱 로딩 시간: 3초 이내
- [ ] 메모리 사용량: 100MB 이하
- [ ] WebSocket 연결 안정성: 99% 이상

### 기능적 지표

- [ ] 기존 기능 100% 이전 완료
- [ ] 네이티브 기능 3개 이상 추가
- [ ] 사용자 경험 만족도: 4점/5점 이상

---

## 8. 결론

본 마이그레이션 계획은 기존 PWA 앱의 비즈니스 로직과 API 연동을 최대한 유지하면서, 네이티브 환경의 이점을 취하는 것을 목표로 합니다. 백엔드 API는 대부분 유지되며, 프론트엔드 컴포넌트와 Web API만 Expo SDK로 전환하면 됩니다.

### ⚠️ 긴급 선결 과제

1. **인증 계약 안정화**: AuthArgumentResolver NPE 방어, 토큰 저장 키 통일
2. **CORS 설정**: Expo 개발 환경 지원
3. **Refresh API 확정**: Silent Refresh 구현을 위한 백엔드 엔드포인트 확인
4. **WebSocket ChatDomain**: 백엔드 처리 범위와 프론트엔드 사용 값 정합성

**예상 개발 기간**: 6-8주 (긴급 과제 해결 후)  
**필요 인력**: React Native 개발자 1명 + 백엔드 지원  
**주요 과제**: UI 컴포넌트 재구현 (67개), 네이티브 기능 연동, 인증 안정화

---

_작성일: 2026-01-20_  
_기반: PWA 프론트엔드 분석 및 Spring Boot 백엔드 API 분석_
