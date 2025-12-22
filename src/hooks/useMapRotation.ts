'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * 🧭 네이버 지도처럼 두 손가락으로 지도를 360도 회전시키는 훅
 * - 데스크탑: 회전 불가 (기존 동작 유지)
 * - 모바일: 두 손가락 터치로 회전
 * - 지도 박스는 그대로, 내부 타일맵만 회전
 * - 회전 후에도 스와이프가 자연스럽게 동작
 */
export function useMapRotation(
  map: any,
  mapDivRef: RefObject<HTMLDivElement>
) {
  const rotationAngleRef = useRef<number>(0); // 현재 회전 각도 (도 단위)
  const initialAngleRef = useRef<number | null>(null);
  const initialRotationRef = useRef<number>(0);
  const isRotatingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!map || !mapDivRef.current) return;
    if (typeof window === 'undefined') return;

    const mapDiv = mapDivRef.current;

    // 지도 내부 타일 컨테이너 찾기 (카카오맵 구조)
    const getTileContainer = (): HTMLElement | null => {
      // 카카오맵의 타일 레이어를 찾음
      const container = mapDiv.querySelector('.MapWrap') as HTMLElement;
      return container || (mapDiv.children[0] as HTMLElement);
    };

    // 타일 컨테이너에 회전 적용
    const applyRotation = (degrees: number) => {
      const tileContainer = getTileContainer();
      if (!tileContainer) return;

      tileContainer.style.transform = `rotate(${degrees}deg)`;
      tileContainer.style.transformOrigin = 'center center';
    };

    // 두 터치 포인트 사이의 각도 계산
    const getAngleBetweenTouches = (touch1: Touch, touch2: Touch): number => {
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    };

    // 터치 시작
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // 두 손가락 터치 시작 - 회전 모드
        isRotatingRef.current = true;
        initialAngleRef.current = getAngleBetweenTouches(e.touches[0], e.touches[1]);
        initialRotationRef.current = rotationAngleRef.current;

        // 카카오맵 기본 제스처 방지
        map.setDraggable(false);
        map.setZoomable(false);

        e.preventDefault();
      } else if (e.touches.length === 1 && rotationAngleRef.current !== 0) {
        // 한 손가락 터치이고 지도가 회전된 상태 - 커스텀 드래그
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };

        // 카카오맵 기본 드래그 방지
        map.setDraggable(false);
        e.preventDefault();
      }
    };

    // 터치 이동
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isRotatingRef.current && initialAngleRef.current !== null) {
        // 회전 중
        const currentAngle = getAngleBetweenTouches(e.touches[0], e.touches[1]);
        const angleDiff = currentAngle - initialAngleRef.current;

        // 새로운 회전 각도 계산 (0~360 범위로 정규화)
        let newRotation = (initialRotationRef.current + angleDiff) % 360;
        if (newRotation < 0) newRotation += 360;

        rotationAngleRef.current = newRotation;

        // 타일 컨테이너만 회전
        applyRotation(newRotation);

        e.preventDefault();
      } else if (e.touches.length === 1 && isDraggingRef.current && dragStartRef.current) {
        // 회전된 상태에서 드래그 중
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        // 화면에서 이동한 거리 (픽셀)
        const dx = currentX - dragStartRef.current.x;
        const dy = currentY - dragStartRef.current.y;

        if (typeof window !== 'undefined' && window.kakao?.maps) {
          const { kakao } = window;

          // 현재 지도 중심점 가져오기
          const center = map.getCenter();
          const projection = map.getProjection();

          // 중심점을 화면 좌표로 변환
          const point = projection.pointFromCoords(center);

          // 회전 각도를 라디안으로 변환 (역회전)
          const angleRad = -(rotationAngleRef.current * Math.PI) / 180;

          // 회전 변환 행렬 적용 - 드래그 방향을 지도 좌표계로 변환
          const rotatedDx = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
          const rotatedDy = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

          // 새로운 중심점 계산 (드래그 반대 방향으로 이동)
          const newPoint = new kakao.maps.Point(
            point.x - rotatedDx,
            point.y - rotatedDy
          );

          // 화면 좌표를 지도 좌표로 변환
          const newCenter = projection.coordsFromPoint(newPoint);

          // 지도 중심점 이동
          map.setCenter(newCenter);
        }

        // 다음 이동을 위해 시작점 갱신
        dragStartRef.current = { x: currentX, y: currentY };

        e.preventDefault();
      }
    };

    // 터치 종료
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        // 두 손가락 중 하나를 뺐을 때 - 회전 종료
        isRotatingRef.current = false;
        initialAngleRef.current = null;

        // 카카오맵 기본 동작 복원 (회전 상태가 아닐 때만)
        if (rotationAngleRef.current === 0) {
          map.setDraggable(true);
        }
        map.setZoomable(true);
      }

      if (e.touches.length === 0) {
        // 모든 터치가 끝남 - 드래그 종료
        isDraggingRef.current = false;
        dragStartRef.current = null;

        // 회전 상태가 아니면 기본 드래그 복원
        if (rotationAngleRef.current === 0) {
          map.setDraggable(true);
        }
      }
    };

    // 터치 취소
    const handleTouchCancel = () => {
      isRotatingRef.current = false;
      initialAngleRef.current = null;
      isDraggingRef.current = false;
      dragStartRef.current = null;

      // 회전 상태가 아니면 기본 동작 복원
      if (rotationAngleRef.current === 0) {
        map.setDraggable(true);
      }
      map.setZoomable(true);
    };

    // 이벤트 리스너 등록
    mapDiv.addEventListener('touchstart', handleTouchStart, { passive: false });
    mapDiv.addEventListener('touchmove', handleTouchMove, { passive: false });
    mapDiv.addEventListener('touchend', handleTouchEnd, { passive: false });
    mapDiv.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    // 초기 회전 적용 (이미 회전된 상태라면)
    if (rotationAngleRef.current !== 0) {
      applyRotation(rotationAngleRef.current);
    }

    // 클린업
    return () => {
      mapDiv.removeEventListener('touchstart', handleTouchStart);
      mapDiv.removeEventListener('touchmove', handleTouchMove);
      mapDiv.removeEventListener('touchend', handleTouchEnd);
      mapDiv.removeEventListener('touchcancel', handleTouchCancel);

      // 회전 초기화
      const tileContainer = getTileContainer();
      if (tileContainer) {
        tileContainer.style.transform = '';
        tileContainer.style.transformOrigin = '';
      }

      // 기본 드래그 복원
      map.setDraggable(true);
    };
  }, [map, mapDivRef]);

  return rotationAngleRef.current;
}
