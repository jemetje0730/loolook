'use client';

import { useEffect, useState, type RefObject } from 'react';

const KR = { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 };
const inRange = (v: number, min: number, max: number) =>
  Number.isFinite(v) && v >= min && v <= max;

function loadLastMyLocation(): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.sessionStorage.getItem('lastMyLocation');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (
      inRange(parsed.lat, KR.minLat, KR.maxLat) &&
      inRange(parsed.lng, KR.minLng, KR.maxLng)
    ) {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch (e) {
    console.warn('failed to read lastMyLocation', e);
  }
  return null;
}

export function useKakaoMap(ready: boolean, mapDivRef: RefObject<HTMLDivElement>) {
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    if (!ready) return;
    if (!mapDivRef.current) return;
    if (typeof window === 'undefined') return;
    if (!window.kakao?.maps) return;

    if (!map) {
      const { kakao } = window;

      const last = loadLastMyLocation();
      const defaultLat = 37.5665; // 서울 시청
      const defaultLng = 126.9780;

      // 먼저 지도를 생성 (즉시 표시)
      let initialLat = defaultLat;
      let initialLng = defaultLng;

      if (last) {
        initialLat = last.lat;
        initialLng = last.lng;
      }

      const m = new kakao.maps.Map(mapDivRef.current, {
        center: new kakao.maps.LatLng(initialLat, initialLng),
        level: 4,
      });
      setMap(m);

      // 저장된 위치가 없고 위치 권한이 있으면 현재 위치로 이동
      if (!last && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            if (inRange(lat, KR.minLat, KR.maxLat) && inRange(lng, KR.minLng, KR.maxLng)) {
              m.setCenter(new kakao.maps.LatLng(lat, lng));
              try {
                window.sessionStorage.setItem('lastMyLocation', JSON.stringify({ lat, lng }));
              } catch (e) {}
            }
          },
          (error) => {
            console.log('Geolocation error:', error.message);
            // 위치 권한 거부되어도 기본 위치(서울)로 지도는 이미 표시됨
          },
        );
      }
    }
  }, [ready, mapDivRef, map]);

  return map; // kakao.maps.Map | null
}
