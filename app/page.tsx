'use client';

import dynamic from 'next/dynamic';
import TopNav from '@/components/TopNav';

// Kakao 지도 SSR 금지
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Page() {
  const TOPNAV_HEIGHT = 64;

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 네비게이션 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: '#fff',
          height: TOPNAV_HEIGHT,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <TopNav />
      </div>

      {/* 지도 영역 */}
      <div
        style={{
          marginTop: TOPNAV_HEIGHT,
          height: `calc(100vh - ${TOPNAV_HEIGHT}px)`,
          width: '100%',
        }}
      >
        <MapView />
      </div>
    </main>
  );
}
