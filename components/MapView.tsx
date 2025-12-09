'use client';

import React, { useCallback, useRef, useState } from 'react';
import DetailPanel from '@/components/DetailPanel';
import { useMapStore } from '@/store/useMapStore';

import { useKakaoLoader } from '@/src/hooks/useKakaoLoader';
import { useKakaoMap } from '@/src/hooks/useKakaoMap';
import { useClusterer } from '@/src/hooks/useClusterer';
import { useMyLocation } from '@/src/hooks/useMyLocation';
import { useToiletMarkers } from '@/src/hooks/useToiletMarkers';

declare global {
  interface Window {
    kakao: any;
  }
}

/** ⚠️ 카카오 JS Key */
const KAKAO_JS_KEY = '21b4298df1918600fd43c18a65d03b57';

/** 상단 필터 버튼들 (기존과 동일) */
const FILTER_BUTTONS = [
  { key: 'male_toilet', label: '남자화장실' },
  { key: 'female_toilet', label: '여자화장실' },
  { key: 'baby_change', label: '기저귀교체' },
  { key: 'male_disabled', label: '장애인화장실' },
];

export default function MapView() {
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
  useMyLocation(map, mapRef);

  // 5) 화장실 마커 로딩 + 필터링
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
        map.panTo(loc);
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
      map.panTo(loc);
      map.setLevel(6);
    };

    window.addEventListener('map-move', handler as EventListener);
    return () => window.removeEventListener('map-move', handler as EventListener);
  }, [map]);

  return (
    <div className="relative w-full h-full">
      {/* 🔍 상단 검색 + 필터 UI (기존과 동일한 모양) */}
      <div className="absolute z-10 top-4 left-1/2 -translate-x-1/2 w-[min(680px,92vw)]">
        <div className="flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur px-3 py-2 shadow">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            placeholder="예: 주소를 입력하세요"
            className="w-full outline-none bg-transparent text-sm md:text-base"
          />
          <button
            onClick={() => handleSearch(query)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-black text-white text-sm"
          >
            검색
          </button>
        </div>

        {/* 필터 버튼 영역 */}
        <div className="flex justify-center mt-3 gap-2 overflow-x-auto">
          {FILTER_BUTTONS.map((f) => (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
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
