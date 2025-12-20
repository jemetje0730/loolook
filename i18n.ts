import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 지원하는 언어 목록
export const locales = ['ko', 'en', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // 지원하는 언어인지 확인
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'ko';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
