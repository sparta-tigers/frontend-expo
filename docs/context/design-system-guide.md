# 📱 반응형 레이아웃 가이드 (Phase 2 완료 기준)

## 🎯 개요

본 문서는 **Phase 2 FSD 아키텍처 완료** 상태를 기준으로 한 반응형 레이아웃 시스템 가이드입니다. `unified-design.ts` 기반의 통합 디자인 시스템을 사용하여 모든 기종에서 일관된 사용자 경험을 제공합니다.

---

## ✅ 현재 구축된 시스템

### 🏗️ FSD 아키텍처 기반 디자인 시스템

- **통합 상수**: `constants/unified-design.ts` 단일 파일 관리
- **절대 경로**: 100% `@/` 경로 사용
- **타입 안정성**: TypeScript Strict Mode 완벽 준수

### 📱 기본 지원 기종

- **iOS**: iPhone SE ~ iPhone 15 Pro Max, iPad Mini ~ iPad Pro
- **Android**: 소형폰 ~ 태블릿, 폴더블폰
- **SafeAreaView**: 노치, 다이내믹 아일랜드, 제스처 바 등 자동 처리

---

## 🚀 통합 디자인 시스템 사용법

### 1. 기본 사용 (모든 기종 동일)

```tsx
import { SafeLayout } from '@/components/ui/safe-layout';

export default function MyScreen() {
  return (
    <SafeLayout withPadding>
      <Text>모든 기종에서 SafeArea 적용됨</Text>
    </SafeLayout>
  );
}
```

### 2. 반응형 디자인 (태블릿 대응)

```tsx
export default function MyScreen() {
  return (
    <SafeLayout withPadding responsive>
      <Text>태블릿에서는 더 넓은 마진 적용</Text>
    </SafeLayout>
  );
}
```

### 3. 통합 상수 활용

```tsx
import { BASE_DESIGN_TOKENS } from '@/constants/unified-design';

export default function MyScreen() {
  return (
    <View style={{ padding: BASE_DESIGN_TOKENS.SPACING.SCREEN }}>
      <Text style={{ fontSize: BASE_DESIGN_TOKENS.FONT_SIZE.TITLE }}>
        통합 디자인 토큰 사용
      </Text>
    </View>
  );
}
```

---

## � 기종별 최적화 전략

### iPhone 시리즈

| 기종         | 화면 너비 | 최적화 전략                    |
| ------------ | --------- | ------------------------------ |
| **SE**       | 320-375px | 작은 화면 최적화, 최소 여백    |
| **Regular**  | 375-414px | 표준 레이아웃, 균형 잡힌 여백  |
| **Plus/Max** | 414px+    | 넓은 화면 활용, 콘텐츠 최대화  |
| **Pro Max**  | 430px+    | Dynamic Island 고려, 최대 활용 |

### Android 기기

| 기종       | 화면 비율 | 최적화 전략                      |
| ---------- | --------- | -------------------------------- |
| **소형폰** | 16:9      | 최소 너비 보장, 콘텐츠 집중      |
| **표준폰** | 18:9      | 표준 레이아웃, 균형 잡힌 디자인  |
| **광폰**   | 21:9      | 넓은 화면 활용, 가로 스크롤 방지 |
| **폴더블** | 가변      | 힌지/클램셸 모드 고려            |

### 태블릿

| 기종          | 화면 크기 | 최적화 전략                    |
| ------------- | --------- | ------------------------------ |
| **iPad Mini** | 7.9"      | 큰 폰으로 처리, 1단 레이아웃   |
| **iPad**      | 10.9"     | 2단 레이아웃 고려, 콘텐츠 확장 |
| **iPad Pro**  | 12.9"     | 최대 화면 활용, 다단 레이아웃  |

---

## 🔧 통합 디자인 토큰

### 스페이싱 시스템

```typescript
import { BASE_DESIGN_TOKENS } from '@/constants/unified-design';

const spacing = BASE_DESIGN_TOKENS.SPACING;
// 결과:
// - SCREEN: 16 (기본 단위)
// - SECTION: 20 (섹션 여백)
// - COMPONENT: 12 (컴포넌트 여백)
// - ELEMENT: 8 (요소 여백)
```

### 폰트 크기 시스템

```typescript
import { BASE_DESIGN_TOKENS } from '@/constants/unified-design';

const fontSize = BASE_DESIGN_TOKENS.FONT_SIZE;
// 결과:
// - TITLE: 24 (제목)
// - SUBTITLE: 18 (부제목)
// - BODY: 16 (본문)
// - CAPTION: 14 (캡션)
```

### 색상 시스템

```typescript
import { BASE_DESIGN_TOKENS } from '@/constants/unified-design';

const colors = BASE_DESIGN_TOKENS.COLORS;
// 결과:
// - PRIMARY: '#007AFF' (기본 색상)
// - SECONDARY: '#5856D6' (보조 색상)
// - SUCCESS: '#34C759' (성공 색상)
// - ERROR: '#FF3B30' (오류 색상)
// - WARNING: '#FF9500' (경고 색상)
```

---

## 🎨 디자인 원칙

### 1. 일관성 (Consistency)

- 모든 기종에서 동일한 사용자 경험
- 통합 디자인 토큰 기반 일관성
- SafeArea 기반 콘텐츠 보장

### 2. 반응성 (Responsiveness)

- 화면 크기에 따른 적절한 여백
- 폰트 크기 자동 조절
- 기종별 최적화된 레이아웃

### 3. 접근성 (Accessibility)

- 최소 터치 영역 보장 (44pt 이상)
- 가독성 있는 폰트 크기
- 명확한 색상 대비

### 4. 플랫폼 적합성 (Platform Compatibility)

- iOS: Human Interface Guidelines 준수
- Android: Material Design 가이드라인 준수
- 네이티브 제스처 지원

---

## 🧪 테스트 방법

### 1. Expo Go 테스트

```bash
# 다양한 기기에서 테스트
npx expo start --dev-client

# 특정 시뮬레이터에서 테스트
npx expo start --ios
npx expo start --android
```

### 2. 디바이스 정보 확인

```typescript
import { logDeviceInfo } from '@/constants/unified-design';

// 개발 중 디바이스 정보 로깅
logDeviceInfo();
// 출력: 📱 Device Info: { width: 390, platform: 'ios', type: 'Phone', size: 'Regular' }
```

### 3. 테스트 체크리스트

#### iOS 기기

- [ ] iPhone SE (소형, 320-375px)
- [ ] iPhone 12/13/14 (표준, 375-414px)
- [ ] iPhone Plus/Max (대형, 414px+)
- [ ] iPhone Pro Max (최대, 430px+)
- [ ] iPad Mini (태블릿, 7.9")
- [ ] iPad (표준 태블릿, 10.9")
- [ ] iPad Pro (대형 태블릿, 12.9")

#### Android 기기

- [ ] Android 소형폰 (320-375px)
- [ ] Android 표준폰 (375-414px)
- [ ] Android 광폰 (414px+)
- [ ] Android 폴더블 (가변)
- [ ] Android 태블릿 (7" 이상)

---

## 📋 Phase 2 완료 상태

### ✅ 완료된 기능

- **통합 디자인 시스템**: `unified-design.ts` 단일 파일
- **타입 안정성**: 100% TypeScript Strict Mode 준수
- **절대 경로**: 100% `@/` 경로 사용
- **SafeLayout**: 모든 기종 SafeArea 자동 처리
- **반응형 상수**: 기종별 최적화된 값

### 🔄 Phase 3 진행 중

- **UI 컴포넌트**: Button, Input, Card, List 완료
- **테마 시스템**: useThemeColor 훅 구축
- **고급 컴포넌트**: Dialog, Select, Dropdown 진행 중

---

## 🏆 결론

현재 시스템은 **FSD 아키텍처 기반 통합 디자인 시스템**을 통해 모든 기종에서 일관되고 최적화된 레이아웃을 제공합니다.

### 핵심 장점

1. **통합 관리**: 단일 파일(`unified-design.ts`)에서 모든 디자인 토큰 관리
2. **타입 안정성**: 100% TypeScript Strict Mode 준수
3. **일관성**: 모든 기종에서 동일한 사용자 경험
4. **반응성**: 기종별 최적화된 마진과 폰트
5. **확장성**: FSD 아키텍처 기반 쉬운 확장

### 다음 단계

Phase 3 UI 컴포넌트 재구현을 통해 통합 디자인 시스템을 모든 컴포넌트에 적용하여 완벽한 네이티브 앱으로 마무리될 예정입니다.

---

_작성일: 2026-02-27_  
_기반: Phase 2 FSD 아키텍처 완료_  
_상태: 통합 디자인 시스템 구축 완료_
