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
        const params = new URLSearchParams({
          public: '1',
          mode: 'all',
        });
        if (filters?.baby_change) params.set('baby_change', '1');
        if (filters?.free) params.set('free', '1');
        if (filters?.gender_neutral) params.set('gender_neutral', '1');

        const res = await fetch(`/api/toilets?${params.toString()}`, {
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const toilets = Array.isArray(data) ? data : [];
        const filtered = toilets.filter((t: any) => matchesActiveFilters(t));

        const markerPromises = filtered.map(async (t: any) => {
          const pos = await getValidLatLng(t);
          if (!pos) return null;

          const m = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(pos.lat, pos.lng),
            clickable: true,
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

        const created = await Promise.all(markerPromises);
        const newMarkers = created.filter(Boolean) as any[];

        clusterer.clear();
        if (newMarkers.length > 0) clusterer.addMarkers(newMarkers);
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.error('fetchAndDraw error:', e);
      } finally {
        isFetching = false;
      }
    };

    fetchAndDraw();

    return () => {
      abortController?.abort();
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
