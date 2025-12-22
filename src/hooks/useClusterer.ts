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
        minLevel: 6,
        disableClickZoom: true, // 수동으로 처리
        calculator: [10, 30, 50],
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
          cursor: 'pointer',
        }],
      });

      // 클러스터 클릭 이벤트 (데스크톱 + 모바일)
      kakao.maps.event.addListener(c, 'clusterclick', (cluster: any) => {
        const level = map.getLevel() - 1;
        map.setLevel(level, { anchor: cluster.getCenter() });
      });

      // 클러스터 생성 후 각 클러스터 마커에 직접 터치 이벤트 추가
      kakao.maps.event.addListener(c, 'clustered', (clusters: any) => {
        // 약간의 지연 후 DOM 요소에 접근
        setTimeout(() => {
          const mapContainer = map.getNode();
          if (!mapContainer) return;

          // 모든 클러스터 div 찾기 (포인터 이벤트가 있는 div)
          const clusterDivs = mapContainer.querySelectorAll('div[style*="rgba(59, 130, 246"]');

          clusterDivs.forEach((div: any) => {
            // 이미 리스너가 추가된 경우 스킵
            if (div.dataset.touchListenerAdded) return;
            div.dataset.touchListenerAdded = 'true';

            // 터치 이벤트 추가
            div.addEventListener('touchend', (e: TouchEvent) => {
              e.preventDefault();
              e.stopPropagation();

              // 클릭 이벤트 강제 발생
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              div.dispatchEvent(clickEvent);
            }, { passive: false });
          });
        }, 100);
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
