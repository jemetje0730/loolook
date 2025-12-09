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
        minLevel: 7,
      });
      setClusterer(c);
    }
  }, [map, clusterer]);

  return clusterer; // kakao.maps.MarkerClusterer | null
}
