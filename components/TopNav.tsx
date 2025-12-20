'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function TopNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-3 sm:px-6">
        {/* 좌측 로고/이름 */}
        <Link href={`/${locale}`} className="font-extrabold tracking-wide text-base sm:text-lg">
          LooLook <span className="text-rose-500"></span>
        </Link>

        {/* 우측 네비게이션 - 모바일 최적화 */}
        <nav className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium text-gray-700">
          {/* About & Contact는 데스크톱에만 표시 */}
          <Link href={`/${locale}/about`} className="hidden md:block hover:text-black">
            {t('about')}
          </Link>
          <Link href={`/${locale}/contact`} className="hidden md:block hover:text-black">
            {t('contact')}
          </Link>

          {/* 모바일 햄버거 메뉴 버튼 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            aria-label="메뉴"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Report 버튼 - 모바일에서 padding 줄임 */}
          <Link
            href={`/${locale}/feedback`}
            className="px-2 py-1 sm:px-3 sm:py-1 rounded-full border hover:bg-gray-100 whitespace-nowrap"
          >
            {t('report')}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 right-0 w-48 bg-white border-b border-l border-gray-200 shadow-lg rounded-bl-lg">
          <div className="flex flex-col py-2">
            <Link
              href={`/${locale}/about`}
              className="px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('about')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('contact')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
