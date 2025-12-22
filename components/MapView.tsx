'use client';

import React, { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMapStore } from '@/store/useMapStore';
import { useTranslations } from 'next-intl';

// 🚀 DetailPanel을 동적 import로 최적화
const DetailPanel = dynamic(() => import('@/components/DetailPanel'), {
  ssr: false,
});

import { useKakaoLoader } from '@/src/hooks/useKakaoLoader';
import { useKakaoMap } from '@/src/hooks/useKakaoMap';
import { useClusterer } from '@/src/hooks/useClusterer';
import { useMyLocation } from '@/src/hooks/useMyLocation';
import { useToiletMarkers } from '@/src/hooks/useToiletMarkers';
import { useMapRotation } from '@/src/hooks/useMapRotation';

declare global {
  interface Window {
    kakao: any;
  }
}

/** ⚠️ 카카오 JS Key */
const KAKAO_JS_KEY = '21b4298df1918600fd43c18a65d03b57';

export default function MapView() {
  const t = useTranslations();

  /** 상단 필터 버튼들 */
  const FILTER_BUTTONS = [
    { key: 'male_toilet', label: t('filter.maleToilet') },
    { key: 'female_toilet', label: t('filter.femaleToilet') },
    { key: 'baby_change', label: t('filter.babyChange') },
    { key: 'male_disabled', label: t('filter.disabledToilet') },
  ];
  const mapRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const { setSelected, filters } = useMapStore((s) => ({
    setSelected: s.setSelected,
    filters: s.filters ?? {},
  }));

  // 1) Kakao SDK 로드
  const ready = useKakaoLoader(KAKAO_JS_KEY);

  // 2) 지도 객체 생성
  const map = useKakaoMap(ready, mapRef);

  // 3) 클러스터러 생성
  const clusterer = useClusterer(map);

  // 4) 내 위치 / 나침반
  const { moveToMyLocation } = useMyLocation(map, mapRef);

  // 5) 360도 회전 기능 (모바일 두 손가락 터치)
  useMapRotation(map, mapRef);

  // 6) 화장실 마커 로딩 + 필터링
  useToiletMarkers(map, clusterer, filters, activeFilters, setSelected);

  /** 🔍 주소+장소 통합 검색 (기존 로직 그대로) */
  const handleSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      if (!map || typeof window === 'undefined' || !window.kakao?.maps?.services) {
        alert('지도 서비스가 로드되지 않았습니다.');
        return;
      }

      const { kakao } = window;
      const geocoder = new kakao.maps.services.Geocoder();
      const places = new kakao.maps.services.Places();

      const moveCenter = (lat: number, lng: number) => {
        const loc = new kakao.maps.LatLng(lat, lng);
        map.setLevel(5);
        map.setCenter(loc);
      };

      const placeFallback = () => {
        places.keywordSearch(
          q,
          (res: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && res.length > 0) {
              const p = res[0];
              const lat = Number(p.y);
              const lng = Number(p.x);
              moveCenter(lat, lng);
            } else {
              alert('해당 위치를 찾을 수 없습니다.');
            }
          },
          { useMapBounds: false, radius: 20000 },
        );
      };

      geocoder.addressSearch(q, (res: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK && res.length > 0) {
          const r = res[0];
          const lat = Number(r.y);
          const lng = Number(r.x);
          moveCenter(lat, lng);
        } else {
          placeFallback();
        }
      });
    },
    [map],
  );

  /** 필터 토글 (위치는 안 움직이고, 마커만 다시 필터) */
  const toggleFilter = (key: string) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  /** 외부에서 map-move 이벤트로 지도 이동 (기존 기능 유지) */
  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ lat: number; lng: number }>;
      if (!map || typeof window === 'undefined' || !window.kakao?.maps) return;
      const { lat, lng } = ce.detail;
      const loc = new window.kakao.maps.LatLng(lat, lng);
      map.setLevel(6);
      map.setCenter(loc);
    };

    window.addEventListener('map-move', handler as EventListener);
    return () => window.removeEventListener('map-move', handler as EventListener);
  }, [map]);

  return (
    <div className="relative w-full h-full">
      {/* 🔍 상단 검색 + 필터 UI - 모바일 최적화 */}
      <div className="absolute z-10 top-2 sm:top-4 left-1/2 -translate-x-1/2 w-[min(680px,95vw)] px-2 sm:px-0">
        <div className="flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur px-3 py-2 shadow">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            placeholder={t('search.placeholder')}
            className="w-full outline-none bg-transparent text-sm md:text-base"
          />
          <button
            onClick={moveToMyLocation}
            className="shrink-0 w-8 h-8 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center transition"
            title="내 위치로 이동"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2.25c-.55 0-1 .45-1 1v1.5c0 .55.45 1 1 1s1-.45 1-1v-1.5c0-.55-.45-1-1-1zm0 16.5c-.55 0-1 .45-1 1v1.5c0 .55.45 1 1 1s1-.45 1-1v-1.5c0-.55-.45-1-1-1zm9.75-7.5h-1.5c-.55 0-1 .45-1 1s.45 1 1 1h1.5c.55 0 1-.45 1-1s-.45-1-1-1zm-16.5 0h-1.5c-.55 0-1 .45-1 1s.45 1 1 1h1.5c.55 0 1-.45 1-1s-.45-1-1-1zM12 7.5c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5z"
              />
            </svg>
          </button>
          <button
            onClick={() => handleSearch(query)}
            className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-black text-white text-xs sm:text-sm whitespace-nowrap"
          >
            {t('search.button')}
          </button>
        </div>

        {/* 필터 버튼 영역 - 모바일 스크롤 최적화 */}
        <div className="flex justify-center mt-2 sm:mt-3 gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_BUTTONS.map((f) => (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className={`shrink-0 w-[85px] sm:w-[100px] py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                activeFilters.includes(f.key)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={mapRef} className="w-full h-full" />
      <DetailPanel />
    </div>
  );
}
