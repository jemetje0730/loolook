'use client';

import { useEffect, useState } from 'react';

export function useClusterer(map: any) {
  const [clusterer, setClusterer] = useState<any>(null);

  useEffect(() => {
    if (!map) return;
    if (typeof window === 'undefined') return;
    if (!window.kakao?.maps?.MarkerClusterer) return;

    if (!clusterer) {
      const { kakao } = window;
      const c = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 6, // 🚀 더 빨리 클러스터링 시작
        disableClickZoom: false,
        calculator: [10, 30, 50], // 🚀 클러스터 크기 최적화
        styles: [{
          width: '40px',
          height: '40px',
          background: 'rgba(59, 130, 246, 0.8)',
          borderRadius: '50%',
          color: '#fff',
          textAlign: 'center',
          lineHeight: '40px',
          fontSize: '13px',
          fontWeight: 'bold',
        }],
      });
      setClusterer(c);
    }

    // Cleanup: 컴포넌트 언마운트 시 clusterer 제거
    return () => {
      if (clusterer) {
        try {
          clusterer.clear();
          clusterer.setMap(null);
        } catch (e) {
          // 이미 제거된 경우 무시
        }
      }
    };
  }, [map, clusterer]);

  return clusterer; // kakao.maps.MarkerClusterer | null
}
