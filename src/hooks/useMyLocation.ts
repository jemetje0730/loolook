'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** 🌏 한국 좌표 범위 */
const KR = { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 };
const inRange = (v: number, min: number, max: number) =>
  Number.isFinite(v) && v >= min && v <= max;

/** 🔵 내 위치 오버레이용 스타일 주입 (한 번만) */
function injectMyLocStylesOnce() {
  if (document.getElementById('my-loc-style')) return;
  const style = document.createElement('style');
  style.id = 'my-loc-style';
  style.textContent = `
    .ml-container{
      position:absolute;
      transform:translate(-50%,-50%);
      transform-origin:center center;
      transition: transform 0.1s ease-out;
    }
    .ml-dot{
      width:20px;height:20px;border-radius:50%;
      background:#1a73e8;
      box-shadow:0 0 0 4px #fff inset, 0 1px 2px rgba(0,0,0,.15);
      position:relative;
      z-index:2;
    }
    .ml-rot{
      position:absolute;
      left:50%;
      top:0;
      transform:translate(-50%,-60%);
      width:12px;
      height:9px;
      z-index:3;
    }
    .ml-tri{
      width:0;height:0;
      border-left:6px solid transparent;
      border-right:6px solid transparent;
      border-bottom:9px solid #1a73e8;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,.25));
      position:absolute;
      left:0;
      top:0;
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
      z-index:1;
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
    zIndex: 999, // 최상위 레이어에 표시
  });

  overlay.setMap(map);

  return { overlay, accEl: acc as HTMLDivElement, rotEl: rot as HTMLDivElement };
}

export function useMyLocation(
  map: any,
  mapDivRef: RefObject<HTMLDivElement>
) {
  const myLocRef = useRef<{ overlay: any; accEl: HTMLDivElement | null; rotEl: HTMLDivElement | null } | null>(null);
  const headingDegRef = useRef<number>(0);
  const smoothedHeadingRef = useRef<number>(0); // 🔵 부드러운 회전을 위한 보간된 값
  const lastUpdateTimeRef = useRef<number>(0); // 🔵 마지막 업데이트 시간
  const cleanupOrientationRef = useRef<null | (() => void)>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

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

      // 위치 저장
      lastLocationRef.current = { lat, lng };

      if (!myLocRef.current) {
        myLocRef.current = createMyLocationOverlay(kakao, map, lat, lng);
      } else {
        myLocRef.current.overlay.setPosition(loc);
        // 오버레이가 지도에서 제거되었을 경우 다시 추가
        if (!myLocRef.current.overlay.getMap()) {
          myLocRef.current.overlay.setMap(map);
        }
      }

      // headingDeg가 제공되면 업데이트, 아니면 현재 저장된 값 사용
      if (typeof headingDeg === 'number' && Number.isFinite(headingDeg)) {
        headingDegRef.current = headingDeg;
      }

      const deg = (headingDegRef.current ?? 0) % 360;

      // 🔵 전체 마커 컨테이너를 회전 (삼각형 + 원 + 점이 일체형으로 회전)
      if (myLocRef.current?.overlay) {
        const container = myLocRef.current.overlay.getContent() as HTMLElement;
        if (container) {
          container.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
        }
      }

      // 세션에 저장
      try {
        window.sessionStorage.setItem('lastMyLocation', JSON.stringify({ lat, lng }));
      } catch (e) {
        console.warn('failed to save lastMyLocation', e);
      }
    };

    // watchPosition으로 위치 추적 (마커만 표시, 지도 이동 안 함)
    if (!geoWatchIdRef.current && navigator.geolocation) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading } = pos.coords;

          // ✅ 한국 좌표 범위 검증 - 범위 밖이면 무시
          if (!inRange(latitude, KR.minLat, KR.maxLat) || !inRange(longitude, KR.minLng, KR.maxLng)) {
            console.warn('Watch location outside Korea bounds:', { latitude, longitude });
            return;
          }

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
        // 🔵 Throttling: 60fps (16ms) 간격으로 업데이트
        const now = Date.now();
        if (now - lastUpdateTimeRef.current < 16) return;
        lastUpdateTimeRef.current = now;

        // alpha: 0~360, 북쪽이 0, 시계방향으로 증가
        const alpha = typeof e.alpha === 'number' ? e.alpha : null;
        if (alpha == null) return;

        // 나침반 방향 계산: 디바이스가 바라보는 방향
        // alpha가 0이면 북쪽, 90이면 동쪽, 180이면 남쪽, 270이면 서쪽
        const targetDeg = (360 - alpha + 360) % 360;

        // 🔵 Deadzone: 3도 이하의 변화는 무시
        const currentDeg = headingDegRef.current;
        const diff = Math.abs(targetDeg - currentDeg);
        const shortestDiff = Math.min(diff, 360 - diff);
        if (shortestDiff < 3) return;

        headingDegRef.current = targetDeg;

        // 🔵 Smoothing: 이전 값과 현재 값을 보간 (0.3 = 30% 새 값, 70% 이전 값)
        const smoothingFactor = 0.3;
        let smoothedDeg = smoothedHeadingRef.current;

        // 360도 경계를 넘을 때 처리 (예: 350도 -> 10도)
        if (Math.abs(targetDeg - smoothedDeg) > 180) {
          if (targetDeg > smoothedDeg) {
            smoothedDeg += 360;
          } else {
            smoothedDeg -= 360;
          }
        }

        smoothedDeg = smoothedDeg * (1 - smoothingFactor) + targetDeg * smoothingFactor;
        smoothedDeg = (smoothedDeg + 360) % 360;
        smoothedHeadingRef.current = smoothedDeg;

        // 🔵 전체 마커 컨테이너를 회전 (삼각형 + 원 + 점이 일체형으로 회전)
        if (myLocRef.current?.overlay) {
          const container = myLocRef.current.overlay.getContent() as HTMLElement;
          if (container) {
            container.style.transform = `translate(-50%, -50%) rotate(${smoothedDeg}deg)`;
          }
        }
      };

      const DO = window.DeviceOrientationEvent;
      if (DO && typeof DO.requestPermission === 'function') {
        // iOS 13+ 권한 요청
        DO.requestPermission()
          .then((state: string) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handler, true);
              cleanupOrientationRef.current = () =>
                window.removeEventListener('deviceorientation', handler, true);
            }
          })
          .catch(() => {
            // 권한 요청 실패 시 무시
          });
      } else {
        // Android 및 이전 iOS 버전
        window.addEventListener('deviceorientation', handler, true);
        cleanupOrientationRef.current = () =>
          window.removeEventListener('deviceorientation', handler, true);
      }
    }

    // 디바이스 방향 자동 활성화
    enableDeviceOrientation();

    // iOS의 경우를 대비해 지도 클릭 시에도 시도
    const DO = window.DeviceOrientationEvent;
    if (DO && typeof DO.requestPermission === 'function') {
      if (mapDivRef.current) {
        const el = mapDivRef.current;
        const clickHandler = () => {
          if (!cleanupOrientationRef.current) {
            enableDeviceOrientation();
          }
        };
        el.addEventListener('click', clickHandler, { once: true });
      }
    }

    return () => {
      if (geoWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      cleanupOrientationRef.current?.();
      cleanupOrientationRef.current = null;

      // overlay 제거
      if (myLocRef.current?.overlay) {
        try {
          myLocRef.current.overlay.setMap(null);
        } catch (e) {
          // 이미 제거된 경우 무시
        }
        myLocRef.current = null;
      }
    };
  }, [map, mapDivRef]);

  // 🧭 내 위치로 이동하는 함수
  const moveToMyLocation = () => {
    if (!map || typeof window === 'undefined' || !window.kakao?.maps) return;

    const { kakao } = window;

    // 저장된 위치가 있으면 그곳으로 이동 + 마커 표시
    if (lastLocationRef.current) {
      const { lat, lng } = lastLocationRef.current;
      const loc = new kakao.maps.LatLng(lat, lng);
      map.setLevel(3);
      map.setCenter(loc);

      // 마커가 없으면 생성, 있으면 지도에 연결 확인
      if (!myLocRef.current) {
        myLocRef.current = createMyLocationOverlay(kakao, map, lat, lng);
      } else {
        myLocRef.current.overlay.setPosition(loc);
        if (!myLocRef.current.overlay.getMap()) {
          myLocRef.current.overlay.setMap(map);
        }
      }
      return;
    }

    // 저장된 위치가 없으면 세션 스토리지에서 확인
    try {
      const saved = window.sessionStorage.getItem('lastMyLocation');
      if (saved) {
        const { lat, lng } = JSON.parse(saved);
        const loc = new kakao.maps.LatLng(lat, lng);
        map.setLevel(3);
        map.setCenter(loc);

        // 마커가 없으면 생성, 있으면 지도에 연결 확인
        if (!myLocRef.current) {
          myLocRef.current = createMyLocationOverlay(kakao, map, lat, lng);
        } else {
          myLocRef.current.overlay.setPosition(loc);
          if (!myLocRef.current.overlay.getMap()) {
            myLocRef.current.overlay.setMap(map);
          }
        }
        return;
      }
    } catch (e) {
      console.warn('failed to load lastMyLocation', e);
    }

    // 위치 정보가 없으면 새로 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading } = pos.coords;

          // ✅ 한국 좌표 범위 검증 - 범위 밖이면 경고
          if (!inRange(latitude, KR.minLat, KR.maxLat) || !inRange(longitude, KR.minLng, KR.maxLng)) {
            console.warn('Location outside Korea bounds:', { latitude, longitude });
            alert('현재 위치가 한국 범위를 벗어났습니다.');
            return;
          }

          const loc = new kakao.maps.LatLng(latitude, longitude);
          map.setLevel(3);
          map.setCenter(loc);

          // 마커 생성
          if (!myLocRef.current) {
            myLocRef.current = createMyLocationOverlay(kakao, map, latitude, longitude);
          } else {
            myLocRef.current.overlay.setPosition(loc);
          }

          // 위치 저장
          lastLocationRef.current = { lat: latitude, lng: longitude };
          try {
            window.sessionStorage.setItem('lastMyLocation', JSON.stringify({ lat: latitude, lng: longitude }));
          } catch (e) {
            console.warn('failed to save lastMyLocation', e);
          }
        },
        (err) => {
          console.warn('Geolocation error:', err);
          alert('현재 위치를 가져올 수 없습니다.');
        },
        { enableHighAccuracy: true },
      );
    }
  };

  return { moveToMyLocation };
}
