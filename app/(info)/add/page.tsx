'use client';
import { useState } from 'react';

// 1. FeatureToggle 컴포넌트가 받을 Props의 타입을 정의합니다.
interface FeatureToggleProps {
  label: string;       // 라벨은 문자열
  active: boolean;     // 활성화 여부는 참/거짓
  onClick: () => void; // 클릭 이벤트는 반환값이 없는 함수
}

// 2. 정의한 타입을 컴포넌트 파라미터 옆에 적어줍니다 (: FeatureToggleProps)
const FeatureToggle = ({ label, active, onClick }: FeatureToggleProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
      active
        ? 'bg-black text-white border-black'
        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
);

// 3. state의 타입도 명확히 하면 더 좋습니다 (선택사항)
interface FeatureState {
  accessible: boolean;
  unisex: boolean;
  babyChange: boolean;
  free: boolean;
}

export default function AddToiletPage() {
  const [name, setName] = useState('');
  
  // useState에 제네릭<FeatureState>을 사용하여 타입 안정성 확보
  const [features, setFeatures] = useState<FeatureState>({
    accessible: false,
    unisex: false,
    babyChange: false,
    free: true,
  });

  // key의 타입을 'FeatureState의 키 값들 중 하나'로 제한
  const toggleFeature = (key: keyof FeatureState) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="pt-40 max-w-xl mx-auto px-4 pb-16">
      <h1 className="text-3xl font-extrabold mb-2">Add a Toilet</h1>
      <p className="text-gray-500 mb-8">
        지도에 없는 화장실을 발견하셨나요? 정보를 공유해주세요.
      </p>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          alert(JSON.stringify({ name, features }, null, 2));
        }}
      >
        {/* 섹션 1: 기본 정보 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              화장실 이름
            </label>
            <input
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 센트럴 파크 공중화장실"
            />
          </div>
        </div>
        {/* 섹션 2: 시설 정보 (UK Map 스타일 - 버튼식 선택) */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">
            시설 정보
          </label>
          <div className="flex flex-wrap gap-2">
            <FeatureToggle
              label="♿ 장애인 화장실"
              active={features.accessible}
              onClick={() => toggleFeature('accessible')}
            />
            <FeatureToggle
              label="👫 남녀공용"
              active={features.unisex}
              onClick={() => toggleFeature('unisex')}
            />
            <FeatureToggle
              label="👶 기저귀 교환대"
              active={features.babyChange}
              onClick={() => toggleFeature('babyChange')}
            />
            <FeatureToggle
              label="💰 무료 이용"
              active={features.free}
              onClick={() => toggleFeature('free')}
            />
          </div>
        </div>
        {/* 섹션 3: 위치 확인 (가상의 지도 영역) */}
        <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-500 text-sm">
          📍 지도에서 위치 핀 설정하기 (구현 예정)
        </div>
        <button
          type="submit"
          className="w-full py-4 rounded-lg bg-black text-white font-bold text-lg hover:bg-gray-800 transition-transform active:scale-[0.99]"
        >
          화장실 등록하기
        </button>
      </form>
    </main>
  );
}