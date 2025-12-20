# 🎨 앱 아이콘 생성 필요

PWA와 WebView 앱을 위한 아이콘이 필요합니다.

## 필요한 파일

### PWA (현재 manifest.json에 설정됨)
- `public/icon-192.png` (192x192px)
- `public/icon-512.png` (512x512px)

### iOS (향후 앱 배포 시)
- 1024x1024 (App Store)
- 180x180 (iPhone)
- 152x152 (iPad)

### Android (향후 앱 배포 시)
- 512x512 (Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)

## 디자인 가이드

### 컨셉
- 🚽 화장실 아이콘
- 📍 위치/지도 느낌
- 깔끔하고 심플한 디자인

### 색상
- Primary: #3b82f6 (파란색 - manifest.json 설정됨)
- Background: #ffffff (하얀색)

### 도구
1. **Figma** - 무료 디자인 도구
2. **Canva** - 간단한 아이콘 생성
3. **pwa-asset-generator** - 자동 생성
   ```bash
   npx pwa-asset-generator logo.svg public/icons
   ```

## 임시 해결책

현재는 아이콘 없이도 PWA가 작동하지만, 다음 단계에서 추가 권장:
1. Figma에서 아이콘 디자인
2. 192x192, 512x512 PNG로 export
3. `public/` 폴더에 저장
4. 배포

---

**Note**: 아이콘 없이도 현재 모든 기능은 정상 작동합니다.
