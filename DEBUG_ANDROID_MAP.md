# Android 에뮬레이터 지도 디버깅 가이드

## 문제: 에뮬레이터에서 지도가 안 보임

### 원인
Kakao Map은 **플랫폼별로 다른 API 키**를 사용합니다:
- 웹: **JavaScript 키**
- Android/iOS: **Native 앱 키**

현재 코드는 플랫폼을 자동 감지하여 올바른 키를 사용하도록 수정되었습니다.

---

## 해결 방법 (필수 단계)

### 1️⃣ Kakao Native 앱 키 발급받기

1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 선택
3. **앱 키** 메뉴에서 **Native 앱 키** 복사
4. `.env.local` 파일 수정:
   ```bash
   NEXT_PUBLIC_KAKAO_NATIVE_KEY=여기에_복사한_Native_앱_키_붙여넣기
   ```

### 2️⃣ Kakao Developers에 Android 플랫폼 등록

1. **플랫폼** 메뉴 클릭
2. **Android 플랫폼 추가**:
   ```
   패키지명: com.loolook.app
   키 해시: (아래 명령어로 생성)
   ```

**키 해시 생성 방법:**
```bash
# Debug 키 해시 (개발/테스트용)
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android | openssl sha1 -binary | openssl base64

# 출력된 해시값을 Kakao Developers에 등록
```

### 3️⃣ 앱 다시 빌드하기

환경변수가 변경되었으므로 앱을 다시 빌드해야 합니다:
```bash
# Next.js 빌드
npm run build

# Capacitor 동기화
npx cap sync

# Android 앱 실행
npx cap run android
```

### 4️⃣ Chrome DevTools로 디버깅 (문제 지속 시)

**에뮬레이터에서 실제 에러를 확인하세요:**

1. Android 에뮬레이터 실행 후 앱 열기
2. **Chrome 브라우저**에서 `chrome://inspect/#devices` 접속
3. "Remote Target" 목록에서 `com.loolook.app` 찾기
4. **"inspect" 버튼** 클릭 → DevTools 열림
5. **Console 탭**에서 에러 확인:
   ```
   예상 에러들:
   - "Kakao SDK load failed"
   - "401 Unauthorized" (API Key 문제)
   - "Mixed Content" (HTTP/HTTPS 문제)
   - "Refused to load..." (CSP 문제)
   ```

**이 방법으로 정확한 에러 메시지를 찾을 수 있습니다!**

### 5️⃣ 에뮬레이터 위치 설정

Android Studio Emulator:
- Extended Controls (...) 클릭
- Location 탭
- 위도/경도 설정 또는 Google Map에서 위치 선택

### 6️⃣ 로그 확인

```bash
# Android 로그 확인
npx cap run android --livereload

# 또는
adb logcat | grep -i "kakao\|map\|location"
```

---

## 체크리스트

### 필수 단계
- [ ] Kakao Developers에서 **Native 앱 키** 복사
- [ ] `.env.local`에 `NEXT_PUBLIC_KAKAO_NATIVE_KEY` 추가
- [ ] Kakao Developers에 Android 플랫폼 등록 (패키지명: `com.loolook.app`)
- [ ] 키 해시 생성 후 Kakao Developers에 등록
- [ ] `npm run build` 실행 (환경변수 적용)
- [ ] `npx cap sync` 실행
- [ ] 앱 재실행

### 문제 지속 시
- [ ] Chrome DevTools로 WebView 콘솔 에러 확인
- [ ] 에뮬레이터 위치 권한 확인
- [ ] AndroidManifest.xml 권한 확인 ✅ (이미 설정됨)

---

## 코드 변경 사항

### 플랫폼 자동 감지
코드가 자동으로 플랫폼을 감지하여 적절한 키를 사용합니다:
- **웹**: JavaScript 키 (`NEXT_PUBLIC_KAKAO_JS_KEY`)
- **Android/iOS**: Native 앱 키 (`NEXT_PUBLIC_KAKAO_NATIVE_KEY`)

위치: [components/MapView.tsx:28-45](components/MapView.tsx#L28-L45)

### 환경변수
- JavaScript 키: `21b4298df1918600fd43c18a65d03b57` (웹용)
- Native 앱 키: `.env.local`에 추가 필요 (Android/iOS용)
