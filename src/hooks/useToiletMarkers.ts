'use client';

import { useEffect, useRef } from 'react';

const KR = { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 };
const inRange = (v: number, min: number, max: number) =>
  Number.isFinite(v) && v >= min && v <= max;

export function useToiletMarkers(
  map: any,
  clusterer: any,
  filters: any,
  activeFilters: string[],
  setSelected: (t: any) => void,
) {
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map || !clusterer) return;
    if (typeof window === 'undefined') return;
    if (!window.kakao?.maps) return;

    const { kakao } = window;

    const matchesActiveFilters = (t: any) => {
      if (activeFilters.length === 0) return true;
      return activeFilters.every((key) => {
        const v = t[key];
        if (key === 'baby_change') {
          if (typeof v === 'boolean') return v === true;
          if (typeof v === 'string') {
            const s = v.trim().toUpperCase();
            return ['O', 'Y', 'YES', 'TRUE', '있음'].includes(s);
          }
          return false;
        }
        return v === 'O';
      });
    };

    const getValidLatLng = async (t: any): Promise<{ lat: number; lng: number } | null> => {
      const lat = Number(t.lat);
      const lng = Number(t.lng);
      if (inRange(lat, KR.minLat, KR.maxLat) && inRange(lng, KR.minLng, KR.maxLng)) {
        return { lat, lng };
      }
      const addr = (t.address || '').trim();
      if (!addr) return null;

      const cached = geocodeCacheRef.current.get(addr);
      if (cached) return cached;

      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`, { cache: 'no-store' });
        if (!r.ok) throw new Error('Geocode API call failed');
        const j = await r.json();
        if (!Number.isFinite(j?.lat) || !Number.isFinite(j?.lng)) return null;
        const pos = { lat: Number(j.lat), lng: Number(j.lng) };
        geocodeCacheRef.current.set(addr, pos);
        return pos;
      } catch (e) {
        console.error('Geocoding fallback error:', e);
        return null;
      }
    };

    let abortController: AbortController | null = null;
    let isFetching = false;

    const fetchAndDraw = async () => {
      if (isFetching) abortController?.abort();
      isFetching = true;
      abortController = new AbortController();

      try {
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        const params = new URLSearchParams({
          public: '1',
          mode: 'bounds',
          swLat: sw.getLat().toString(),
          swLng: sw.getLng().toString(),
          neLat: ne.getLat().toString(),
          neLng: ne.getLng().toString(),
        });

        const res = await fetch(`/api/toilets?${params.toString()}`, {
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const toilets = Array.isArray(data) ? data : [];
        const filtered = toilets.filter((t: any) => matchesActiveFilters(t));

        // 🚀 성능 최적화: 마커를 배치로 처리 (한번에 50개씩)
        const BATCH_SIZE = 50;
        const newMarkers: any[] = [];

        for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
          const batch = filtered.slice(i, i + BATCH_SIZE);

          const markerPromises = batch.map(async (t: any) => {
            const pos = await getValidLatLng(t);
            if (!pos) return null;

            // SVG 데이터 URL로 작은 커스텀 마커 생성 (기본 마커와 동일한 모양)
            const svgString = `
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="30" viewBox="0 0 29 42">
                <path fill="#1a73e8" d="M14.5,0C6.5,0,0,6.5,0,14.5C0,25.2,14.5,42,14.5,42S29,25.2,29,14.5C29,6.5,22.5,0,14.5,0z"/>
                <circle fill="#FFF" cx="14.5" cy="14.5" r="7"/>
              </svg>
            `.trim();

            const svgDataUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgString);
            const imageSize = new kakao.maps.Size(20, 30);
            const imageOption = { offset: new kakao.maps.Point(10, 30) };

            const markerImage = new kakao.maps.MarkerImage(svgDataUrl, imageSize, imageOption);

            const m = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(pos.lat, pos.lng),
              clickable: true,
              image: markerImage,
            });

            kakao.maps.event.addListener(m, 'click', () => {
              setSelected({
                id: t.id,
                name: t.name,
                address: t.address,
                lat: pos.lat,
                lng: pos.lng,
                category: t.category ?? null,
                phone: t.phone ?? null,
                open_time: t.open_time ?? null,
                male_toilet: t.male_toilet ?? null,
                female_toilet: t.female_toilet ?? null,
                male_disabled: t.male_disabled ?? null,
                female_disabled: t.female_disabled ?? null,
                male_child: t.male_child ?? null,
                female_child: t.female_child ?? null,
                emergency_bell: t.emergency_bell ?? null,
                cctv: t.cctv ?? null,
                baby_change: t.baby_change ?? null,
              });
            });

            return m;
          });

          const batchMarkers = await Promise.all(markerPromises);
          newMarkers.push(...batchMarkers.filter(Boolean));

          // 배치 간 짧은 대기 시간으로 UI 블로킹 방지
          if (i + BATCH_SIZE < filtered.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }

        clusterer.clear();
        if (newMarkers.length > 0) clusterer.addMarkers(newMarkers);
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.error('fetchAndDraw error:', e);
      } finally {
        isFetching = false;
      }
    };

    const debouncedFetchAndDraw = () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchTimeoutRef.current = setTimeout(() => {
        fetchAndDraw();
      }, 300);
    };

    fetchAndDraw();

    const idleListener = kakao.maps.event.addListener(map, 'idle', debouncedFetchAndDraw);

    return () => {
      abortController?.abort();
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (idleListener) {
        try {
          kakao.maps.event.removeListener(idleListener);
        } catch (e) {
          // 이미 제거된 경우 무시
        }
      }
    };
  }, [
    map,
    clusterer,
    filters?.baby_change,
    filters?.free,
    filters?.gender_neutral,
    activeFilters,
    setSelected,
  ]);
}
