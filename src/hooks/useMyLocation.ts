'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** 🔵 내 위치 오버레이용 스타일 주입 (한 번만) */
function injectMyLocStylesOnce() {
  if (document.getElementById('my-loc-style')) return;
  const style = document.createElement('style');
  style.id = 'my-loc-style';
  style.textContent = `
    .ml-container{position:absolute;transform:translate(-50%,-50%);}
    .ml-dot{
      width:20px;height:20px;border-radius:50%;
      background:#1a73e8;
      box-shadow:0 0 0 4px #fff inset, 0 1px 2px rgba(0,0,0,.15);
    }
    .ml-rot{position:absolute;left:50%;top:0;transform:translate(-50%,-60%) rotate(0deg);transform-origin:50% 12px;}
    .ml-tri{
      width:0;height:0;
      border-left:6px solid transparent;
      border-right:6px solid transparent;
      border-bottom:9px solid #1a73e8;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,.25));
    }
    /* 🔵 줌과 상관없이 항상 같은 픽셀 크기로 보이는 정확도 원 */
    .ml-accuracy-ring{
      position:absolute;
      left:50%;
      top:50%;
      width:30px;
      height:30px;
      border-radius:50%;
      transform:translate(-50%,-50%);
      background:rgba(26,115,232,0.18);
      border:2px solid rgba(26,115,232,0.7);
      pointer-events:none;
    }
  `;
  document.head.appendChild(style);
}

/** 🔵 내 위치 오버레이 생성 (HTML 기반 정확도 원) */
function createMyLocationOverlay(kakao: any, map: any, lat: number, lng: number) {
  injectMyLocStylesOnce();

  const container = document.createElement('div');
  container.className = 'ml-container';

  const dot = document.createElement('div');
  dot.className = 'ml-dot';

  const rot = document.createElement('div');
  rot.className = 'ml-rot';
  const tri = document.createElement('div');
  tri.className = 'ml-tri';
  rot.appendChild(tri);

  const acc = document.createElement('div');
  acc.className = 'ml-accuracy-ring'; // ✅ 항상 같은 화면 크기 원

  container.appendChild(acc);
  container.appendChild(dot);
  container.appendChild(rot);

  const overlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(lat, lng),
    content: container,
    yAnchor: 0.5,
    xAnchor: 0.5,
  });

  overlay.setMap(map);

  return { overlay, accEl: acc as HTMLDivElement, rotEl: rot as HTMLDivElement };
}

export function useMyLocation(map: any, mapDivRef: RefObject<HTMLDivElement>) {
  const myLocRef = useRef<{ overlay: any; accEl: HTMLDivElement | null; rotEl: HTMLDivElement | null } | null>(null);
  const headingDegRef = useRef<number>(0);
  const cleanupOrientationRef = useRef<null | (() => void)>(null);
  const geoWatchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) return;
    if (typeof window === 'undefined') return;
    if (!window.kakao?.maps) return;

    const { kakao } = window;

    const updateMyLocVisual = (
      lat: number,
      lng: number,
      _accuracy?: number,
      headingDeg?: number | null,
    ) => {
      const loc = new kakao.maps.LatLng(lat, lng);

      if (!myLocRef.current) {
        myLocRef.current = createMyLocationOverlay(kakao, map, lat, lng);
      } else {
        myLocRef.current.overlay.setPosition(loc);
        // accEl은 컨테이너 안에 있어서 별도로 radius 조정할 필요 없음
      }

      const deg = (headingDeg ?? headingDegRef.current ?? 0) % 360;
      if (myLocRef.current?.rotEl) {
        myLocRef.current.rotEl.style.transform = `translate(-50%,-60%) rotate(${deg}deg)`;
      }

      // 세션에 저장
      try {
        window.sessionStorage.setItem('lastMyLocation', JSON.stringify({ lat, lng }));
      } catch (e) {
        console.warn('failed to save lastMyLocation', e);
      }
    };

    // 첫 위치 + watchPosition
    if (!geoWatchIdRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading } = pos.coords;
          updateMyLocVisual(latitude, longitude, accuracy, heading ?? null);

          const loc = new kakao.maps.LatLng(latitude, longitude);
          map.setLevel(4);
          map.panTo(loc);
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true },
      );

      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading } = pos.coords;
          if (typeof heading === 'number' && Number.isFinite(heading)) {
            headingDegRef.current = heading;
          }
          updateMyLocVisual(latitude, longitude, accuracy, heading ?? null);
        },
        (err) => console.warn('Geolocation watch error:', err),
        { enableHighAccuracy: true },
      );
    }

    function enableDeviceOrientation() {
      if (cleanupOrientationRef.current) return;

      const handler = (e: any) => {
        const alpha = typeof e.alpha === 'number' ? e.alpha : null;
        if (alpha == null) return;
        const deg = (360 - alpha + 360) % 360;
        headingDegRef.current = deg;
        if (myLocRef.current?.rotEl) {
          myLocRef.current.rotEl.style.transform = `translate(-50%,-60%) rotate(${deg}deg)`;
        }
      };

      const DO = window.DeviceOrientationEvent;
      if (DO && typeof DO.requestPermission === 'function') {
        DO.requestPermission()
          .then((state: string) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handler, true);
              cleanupOrientationRef.current = () =>
                window.removeEventListener('deviceorientation', handler, true);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handler, true);
        cleanupOrientationRef.current = () =>
          window.removeEventListener('deviceorientation', handler, true);
      }
    }

    // 지도 div 클릭 시 방향 권한 요청
    if (mapDivRef.current) {
      const el = mapDivRef.current;
      el.addEventListener('click', enableDeviceOrientation, { once: true });
    }

    return () => {
      if (geoWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      cleanupOrientationRef.current?.();
      cleanupOrientationRef.current = null;
    };
  }, [map, mapDivRef]);
}
