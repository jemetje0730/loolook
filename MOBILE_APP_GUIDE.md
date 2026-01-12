# 📱 LooLook 모바일 앱 배포 가이드

이 가이드는 LooLook 웹 앱을 iOS App Store와 Google Play Store에 배포하는 전체 과정을 안내합니다.

## 🎯 현재 상태

✅ Capacitor 설치 및 설정 완료
✅ iOS 플랫폼 추가 완료
✅ Android 플랫폼 추가 완료
✅ Geolocation(위치) 권한 설정 완료
✅ Vercel 웹사이트를 앱에서 로드하도록 설정 완료

## 📋 준비 사항 체크리스트

### iOS (App Store)
- [ ] macOS 컴퓨터
- [ ] Xcode 설치 (App Store에서 무료 다운로드)
- [ ] CocoaPods 설치: `sudo gem install cocoapods`
- [ ] Apple Developer 계정 ($99/년)
- [ ] 앱 아이콘 준비 (1024x1024 PNG)

### Android (Play Store)
- [ ] Android Studio 설치
- [ ] JDK 17 이상 설치
- [ ] Google Play Developer 계정 ($25 일회성)
- [ ] 앱 아이콘 준비 (512x512 PNG)

## 🚀 빠른 시작

### 1. 프로젝트 동기화
```bash
npm run cap:sync
```

### 2. iOS 앱 테스트
```bash
# Xcode에서 프로젝트 열기
npm run cap:open:ios

# 또는 시뮬레이터에서 직접 실행
npm run cap:run:ios
```

Xcode에서:
1. 상단에서 시뮬레이터 선택 (예: iPhone 15)
2. ▶️ 버튼 클릭하여 실행
3. 앱이 시뮬레이터에서 열리고 https://loolook.vercel.app을 로드합니다

### 3. Android 앱 테스트
```bash
# Android Studio에서 프로젝트 열기
npm run cap:open:android

# 또는 에뮬레이터에서 직접 실행
npm run cap:run:android
```

Android Studio에서:
1. AVD Manager에서 에뮬레이터 생성 (없으면)
2. ▶️ Run 버튼 클릭
3. 앱이 에뮬레이터에서 실행됩니다

## 🎨 앱 아이콘 만들기

### 옵션 1: 온라인 도구 사용 (추천)
1. [Canva](https://www.canva.com/)에서 1024x1024 아이콘 디자인
2. 화장실 🚽 + 지도 📍 컨셉으로 제작
3. PNG로 다운로드

### 옵션 2: cordova-res로 자동 생성
```bash
npm install -g cordova-res

# resources 폴더 생성
mkdir resources

# 1024x1024 아이콘을 resources/icon.png에 저장
# (직접 제작하거나 디자이너에게 요청)

# 모든 크기 자동 생성
cordova-res ios --skip-config --copy
cordova-res android --skip-config --copy
```

### 옵션 3: 임시로 기본 아이콘 사용
- 현재 Capacitor 기본 아이콘이 설정되어 있음
- 나중에 언제든지 교체 가능

## 📱 iOS App Store 배포

### 1단계: Apple Developer 계정 설정
1. https://developer.apple.com 에서 계정 등록 ($99/년)
2. Certificates, Identifiers & Profiles 설정

### 2단계: Xcode에서 앱 서명
```bash
npm run cap:open:ios
```

Xcode에서:
1. 프로젝트 네비게이터에서 "App" 선택
2. "Signing & Capabilities" 탭
3. Team: 본인의 Apple Developer 팀 선택
4. Bundle Identifier 확인: `com.loolook.app`

### 3단계: 앱 정보 업데이트
Info.plist에서 확인:
- `CFBundleDisplayName`: 앱 이름 (현재: LooLook)
- `NSLocationWhenInUseUsageDescription`: 위치 권한 설명 (설정됨)

### 4단계: 아카이브 생성
1. Xcode 상단 메뉴: Product > Destination > Any iOS Device
2. Product > Archive
3. 빌드 완료 후 Organizer 창이 열림

### 5단계: App Store Connect에 업로드
1. Archive 선택 후 "Distribute App" 클릭
2. App Store Connect 선택
3. Upload 선택
4. 자동 서명 옵션 선택
5. Upload 완료 대기 (5-10분)

### 6단계: App Store Connect에서 앱 등록
1. https://appstoreconnect.apple.com 접속
2. "My Apps" > "+" > "New App"
3. 앱 정보 입력:
   - 이름: LooLook
   - 언어: 한국어
   - Bundle ID: com.loolook.app
   - SKU: loolook (임의의 고유 ID)

4. 앱 정보 작성:
   - 스크린샷 (iPhone 6.7", 6.5" 필수)
   - 앱 설명
   - 키워드
   - 지원 URL
   - 마케팅 URL (선택)
   - 카테고리: 유틸리티 또는 여행

5. Build 연결:
   - TestFlight > iOS Builds에서 업로드된 빌드 선택
   - App Store > "+" 클릭하여 빌드 추가

6. 심사 제출:
   - "Submit for Review" 클릭
   - 심사 기간: 보통 1-3일

## 🤖 Google Play Store 배포

### 1단계: Google Play Developer 계정 생성
1. https://play.google.com/console 접속
2. 계정 등록 ($25 일회성 결제)

### 2단계: Android Studio에서 서명된 APK/AAB 생성
```bash
npm run cap:open:android
```

Android Studio에서:
1. Build > Generate Signed Bundle / APK
2. Android App Bundle 선택 (AAB 권장)
3. "Create new..." 클릭하여 키스토어 생성:
   - Key store path: 안전한 위치에 저장 (백업 필수!)
   - Password: 강력한 비밀번호 설정
   - Alias: loolook
   - Validity: 25년
   - 인증서 정보 입력
4. Release 선택
5. 빌드 완료 대기

⚠️ **중요**: 키스토어 파일과 비밀번호를 안전하게 보관하세요! 분실 시 앱 업데이트 불가능!

### 3단계: Google Play Console에서 앱 생성
1. Play Console > "앱 만들기"
2. 앱 정보:
   - 앱 이름: LooLook
   - 기본 언어: 한국어
   - 앱 또는 게임: 앱
   - 무료/유료: 무료

### 4단계: 스토어 등록 정보 입력
1. **앱 정보**
   - 간단한 설명 (80자)
   - 자세한 설명
   - 앱 아이콘 (512x512)
   - 그래픽 이미지 (1024x500)

2. **스크린샷**
   - 휴대전화 (최소 2개)
   - 7인치 태블릿 (선택)
   - 10인치 태블릿 (선택)

3. **카테고리**
   - 앱 카테고리: 도구 또는 여행 및 지역 정보

4. **연락처 세부정보**
   - 이메일
   - 전화번호 (선택)
   - 웹사이트

### 5단계: 앱 콘텐츠 설정
1. 개인정보처리방침 URL
2. 앱 액세스 권한 (위치 권한 설명)
3. 광고 여부
4. 타겟 연령층
5. 뉴스 앱 여부

### 6단계: AAB 업로드
1. 프로덕션 > 새 버전 만들기
2. AAB 파일 업로드
3. 출시 노트 작성
4. 검토 후 "프로덕션으로 출시" 클릭

### 7단계: 심사 대기
- 심사 기간: 보통 1-7일
- 첫 출시는 더 오래 걸릴 수 있음

## 🔧 개발 팁

### 로컬 개발 서버 사용
개발 중에는 로컬 서버를 사용하여 빠르게 테스트할 수 있습니다:

1. `capacitor.config.ts` 수정:
```typescript
const config: CapacitorConfig = {
  appId: 'com.loolook.app',
  appName: 'LooLook',
  webDir: 'out',
  server: {
    url: 'http://localhost:3000',  // 로컬 개발 서버
    cleartext: true
  }
};
```

2. 개발 서버 실행:
```bash
npm run dev
```

3. 앱에서 테스트:
```bash
npm run cap:sync
npm run cap:run:ios
# 또는
npm run cap:run:android
```

⚠️ **주의**: 배포 전에 다시 `https://loolook.vercel.app`으로 변경하세요!

### 라이브 리로드
더 빠른 개발을 위해:
```bash
# 터미널 1: Next.js 개발 서버
npm run dev

# 터미널 2: Capacitor 실행 (위 설정 적용 후)
npm run cap:run:ios
```

코드 수정 시 앱이 자동으로 새로고침됩니다.

## 📊 앱 업데이트 배포

### Vercel 웹사이트 업데이트만 하는 경우
- Vercel에 배포하면 자동으로 앱에 반영됨
- 별도 앱 스토어 업데이트 불필요
- 사용자가 앱을 열 때마다 최신 버전 로드

### 네이티브 기능 변경 시 (권한 추가, 플러그인 추가 등)
iOS:
```bash
npm run cap:sync
npm run cap:open:ios
# Xcode에서 Product > Archive 후 재배포
```

Android:
```bash
npm run cap:sync
npm run cap:open:android
# Android Studio에서 AAB 재생성 후 업로드
```

## 🎯 다음 단계

1. [ ] 앱 아이콘 제작
2. [ ] iOS 시뮬레이터에서 테스트
3. [ ] Android 에뮬레이터에서 테스트
4. [ ] Apple Developer 계정 등록
5. [ ] Google Play Developer 계정 등록
6. [ ] 스크린샷 준비 (다양한 화면 크기)
7. [ ] 앱 설명 작성
8. [ ] 개인정보처리방침 페이지 작성
9. [ ] iOS 배포
10. [ ] Android 배포

## 🆘 문제 해결

### iOS 빌드 오류
```bash
# CocoaPods 재설치
cd ios/App
pod install
cd ../..
```

### Android 빌드 오류
```bash
# Gradle 캐시 정리
cd android
./gradlew clean
cd ..
```

### 권한 오류
- iOS: `ios/App/App/Info.plist` 확인
- Android: `android/app/src/main/AndroidManifest.xml` 확인

## 📚 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [iOS App Store 심사 가이드라인](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play 정책](https://play.google.com/about/developer-content-policy/)
- [앱 아이콘 디자인 가이드](https://developer.apple.com/design/human-interface-guidelines/app-icons)

---

**행운을 빕니다! 🚀**

문제가 생기면 Capacitor 공식 문서나 Stack Overflow를 참고하세요.
