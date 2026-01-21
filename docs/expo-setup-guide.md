# Expo Go 개발 환경 설정 A to Z 가이드

## 📋 개요

본 가이드는 **Expo Go** 개발 환경을 설정하는 방법을 단계별로 상세히 안내합니다.

### 🎯 목표

- Expo 개발 환경 완벽 구축
- 기본 프로젝트 생성 및 실행
- 팀원 모두 동일한 환경 설정

---

## 1. 사전 준비 사항

### 1.1 필수 소프트웨어 설치

#### **Node.js 설치**

```bash
# 공식 웹사이트에서 LTS 버전 다운로드
# https://nodejs.org/
# 또는 Homebrew 사용 (macOS)
brew install node
```

#### node.js 설치 확인

```bash
node --version  # v18.0.0 이상
npm --version   # 8.0.0 이상
```

#### Git 설치

```bash
# macOS
brew install git

# Windows
# https://git-scm.com/download/win
```

---

## 2. Expo CLI 설치

### 2.1 새로운 Expo CLI 사용 (권장)

**⚠️ 중요**: Node.js 17+ 버전에서는 더 이상 전역 설치가 필요 없습니다. `npx`로 직접 사용합니다.

```bash
# 전역 설치 불필요 - npx로 바로 사용 가능
npx create-expo-app --version  # 버전 확인
```

#### expo-cli 설치 확인

```bash
npx expo --version
```

### 2.2 레거시 버전 사용자 (Node 16 이하)

```bash
# Node 16 이하에서만 전역 설치 필요
npm install -g expo-cli
expo --version
```

**⚠️ 경고**: Node 17+에서는 레거시 expo-cli가 호환되지 않습니다. 반드시 npx 방식을 사용하세요.

### 2.3 Expo 계정 생성

1. [Expo 공식 웹사이트](https://expo.dev/) 방문
2. 회원가입 (Google/GitHub 계정 연동 권장)
3. 이메일 인증 완료

---

## 3. 개발 도구 설치

### 3.1 VS Code 설치 및 확장 프로그램

#### **VS Code 다운로드**

- [공식 웹사이트](https://code.visualstudio.com/)에서 설치

#### **필수 확장 프로그램**

```plaintext
1. ES7+ React/Redux/React-Native snippets
   - 확장 ID: dsznajder.es7-react-js-snippets

2. TypeScript Importer
   - 확장 ID: pmneo.tsimporter

3. Prettier - Code formatter
   - 확장 ID: esbenp.prettier-vscode

4. ESLint
   - 확장 ID: dbaeumer.vscode-eslint
```

### 3.2 모바일 앱 설치

#### **Expo Go 앱**

- **iOS**: App Store에서 "Expo Go" 검색 후 설치
- **Android**: Play Store에서 "Expo Go" 검색 후 설치

---

## 4. 프로젝트 실행

### 4.1 개발 서버 시작

```bash
cd expo-spartatigers
npx expo start
# 또는
npm start
```

### 4.2 실행 옵션 확인

터미널에 QR코드와 함께 다음 옵션이 표시됩니다:

```plaintext
› Metro waiting on exp://192.168.0.100:19000
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press w │ open in web browser
› Press i │ open iOS simulator
› Press s │ send link with email or SMS
```

### 4.3 모바일에서 실행

1. 스마트폰에서 Expo Go 앱 실행
2. QR코드 스캔
3. 프로젝트 자동 로딩 및 실행

---

## 5. 기본 개발 워크플로우

### 5.1 코드 수정 및 핫 리로딩

1. **VS Code에서 `App.tsx` 열기**

```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>스파르타 타이거즈 앱에 오신 것을 환영합니다!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

1. **파일 저장**: 자동으로 앱이 업데이트됨 (Hot Reloading)

### 5.2 개발자 메뉴 활용

- **iOS**: ⌘ + D (Cmd + D)
- **Android**: ⌘ + M (Cmd + M) 또는 흔들기

#### 주요 메뉴

- **Reload**: 앱 새로고침
- **Toggle Inspector**: 요소 검사 도구
- **Performance Monitor**: 성능 모니터링
- **Remote Debugging**: Chrome 개발자 도구 연동

---

## 6. 팀원별 환경 설정 체크리스트

### 6.1 설치 확인

```bash
# 버전 확인 명령어
node --version    # v18.0.0+
npm --version     # 8.0.0+
expo --version    # 최신 버전
```

### 6.2 프로젝트 실행 테스트

```bash
# 프로젝트 복제
git clone [프로젝트 주소]
cd expo-spartatigers

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 6.3 모바일 연동 테스트

1. Expo Go 앱으로 QR코드 스캔
2. 앱이 정상적으로 로딩되는지 확인
3. 코드 수정 시 핫 리로딩 동작 확인

---

## 7. 자주 발생하는 문제 및 해결

### 7.1 "Metro is already running" 오류

```bash
# 포트 강제 종료
npx kill-port 19000
# 또는
lsof -ti:19000 | xargs kill -9
```

### 7.2 "Cannot find module" 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 7.3 QR코드 스캔이 안될 때

1. **동일한 WiFi 네트워크**에 연결 확인
2. **방화벽** 설정 확인
3. **터널링 모드** 사용:

   ```bash
   expo start --tunnel
   ```

### 7.4 iOS 시뮬레이터 실행 오류

```bash
# Xcode Command Line Tools 설치
xcode-select --install

# 시뮬레이터 목록 확인
xcrun simctl list devices
```

---

## 8. 유용한 Expo 명령어 모음

### 8.1 기본 명령어

```bash
# 개발 서버 시작
expo start

# 특정 플랫폼만 실행
expo start --ios      # iOS 시뮬레이터
expo start --android   # Android 에뮬레이터
expo start --web       # 웹 브라우저

# 터널링 모드 (외부 네트워크)
expo start --tunnel

# 캐시 초기화
expo start -c
```

### 8.2 빌드 및 배포

```bash
# APK 빌드 (Android)
expo build:android

# IPA 빌드 (iOS)
expo build:ios

# 앱 미리보기
expo publish
```

---

## 9. 다음 단계

### 9.1 학습 자료

- [Expo 공식 문서](https://docs.expo.dev/)
- [React Native 공식 문서](https://reactnative.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

### 9.2 프로젝트 설정

1. **ESLint/Prettier 설정**: 코드 스타일 통일
2. **Git 설정**: .gitignore 설정 확인
3. **환경변수 설정**: .env 파일 설정

---

### 공식 지원

- [Expo 포럼](https://forums.expo.dev/)
- [React Native 커뮤니티](https://github.com/react-native-community)

---

_작성일: 2026-01-21_  
_버전: Expo SDK 50+ 기준_  
_대상: Expo/React Native/TypeScript 초보 개발자_
