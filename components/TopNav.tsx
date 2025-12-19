'use client';

import Link from 'next/link';

export default function TopNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
        {/* 좌측 로고/이름 */}
        <Link href="/" className="font-extrabold tracking-wide text-lg">
          LooLook <span className="text-rose-500"></span>
        </Link>

        {/* 우측 네비게이션 */}
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/about" className="hover:text-black">
            About
          </Link>
          <Link href="/contact" className="hover:text-black">
            Contact
          </Link>
          <Link
            href="/feedback"
            className="px-3 py-1 rounded-full border hover:bg-gray-100"
          >
            Report
          </Link>
        </nav>
      </div>
    </header>
  );
}
