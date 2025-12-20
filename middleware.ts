import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  // 지원하는 언어 목록
  locales,

  // 기본 언어 (한국어)
  defaultLocale: 'ko',

  // URL에 항상 locale prefix를 포함
  localePrefix: 'always',

  // 브라우저 언어 감지 비활성화 - 항상 한국어 기본
  localeDetection: false,
});

export const config = {
  // 모든 경로에 대해 middleware 실행 (static 파일 제외)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
