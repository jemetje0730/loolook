'use client';
import { useEffect, useState } from 'react';

interface Stats {
  total: number;
  public: number;
  disabled: number;
  babyChange: number;
}

export default function AboutPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch stats:', error);
        setIsLoading(false);
      });
  }, []);

  return (
    <main className="pt-40 max-w-3xl mx-auto px-4 pb-16">
      {/* 헤더 섹션 */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
          About LooLook
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          누구나, 언제 어디서든, <br />
          존엄하게 화장실을 이용할 권리가 있습니다.
        </p>
      </div>

      {/* 통계 섹션 */}
      <div className="mb-12">
        {/* 주요 통계 */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-4">
          <span className="block text-5xl font-bold text-black mb-2">
            {isLoading ? '...' : stats?.total.toLocaleString() || '0'}
          </span>
          <span className="text-sm font-medium text-gray-700">전체 화장실</span>
        </div>

        {/* 세부 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-800">
                {isLoading ? '...' : stats?.public.toLocaleString() || '0'}
              </span>
              <span className="text-sm text-gray-400">/ {isLoading ? '...' : stats?.total.toLocaleString() || '0'}</span>
            </div>
            <span className="text-xs text-gray-600">무료 개방 화장실</span>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-800">
                {isLoading ? '...' : stats?.disabled.toLocaleString() || '0'}
              </span>
              <span className="text-sm text-gray-400">/ {isLoading ? '...' : stats?.total.toLocaleString() || '0'}</span>
            </div>
            <span className="text-xs text-gray-600">장애인 화장실</span>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-800">
                {isLoading ? '...' : stats?.babyChange.toLocaleString() || '0'}
              </span>
              <span className="text-sm text-gray-400">/ {isLoading ? '...' : stats?.total.toLocaleString() || '0'}</span>
            </div>
            <span className="text-xs text-gray-600">기저귀 교환대</span>
          </div>
        </div>
      </div>

      {/* 본문 콘텐츠 */}
      <div className="prose prose-gray max-w-none">
        <h3 className="text-lg font-bold text-black">프로젝트 소개</h3>
        <p>
          LooLook은 공공 데이터와 사용자 제보를 결합하여 가장 정확한 화장실 지도를 만드는 비영리 프로젝트입니다.
          특히 장애인 접근성, 기저귀 교환대 유무 등 실질적으로 필요한 정보를 제공하는 데 집중합니다.
        </p>

        <h3 className="text-lg font-bold text-black mt-8">데이터 출처</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>공공데이터포털 (Public Data Portal)</li>
          <li>OpenStreetMap Contributors</li>
          <li>LooLook 사용자 여러분의 소중한 제보</li>
        </ul>
      </div>
    </main>
  );
}