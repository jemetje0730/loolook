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
      const defaultLat = 37.5665;
      const defaultLng = 126.9780;

      if (last) {
        const m = new kakao.maps.Map(mapDivRef.current, {
          center: new kakao.maps.LatLng(last.lat, last.lng),
          level: 4,
        });
        setMap(m);
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;

              if (inRange(lat, KR.minLat, KR.maxLat) && inRange(lng, KR.minLng, KR.maxLng)) {
                const m = new kakao.maps.Map(mapDivRef.current!, {
                  center: new kakao.maps.LatLng(lat, lng),
                  level: 4,
                });
                try {
                  window.sessionStorage.setItem('lastMyLocation', JSON.stringify({ lat, lng }));
                } catch (e) {}
                setMap(m);
              } else {
                const m = new kakao.maps.Map(mapDivRef.current!, {
                  center: new kakao.maps.LatLng(defaultLat, defaultLng),
                  level: 4,
                });
                setMap(m);
              }
            },
            () => {
              const m = new kakao.maps.Map(mapDivRef.current!, {
                center: new kakao.maps.LatLng(defaultLat, defaultLng),
                level: 4,
              });
              setMap(m);
            },
          );
        } else {
          const m = new kakao.maps.Map(mapDivRef.current, {
            center: new kakao.maps.LatLng(defaultLat, defaultLng),
            level: 4,
          });
          setMap(m);
        }
      }
    }
  }, [ready, mapDivRef, map]);

  return map; // kakao.maps.Map | null
}
