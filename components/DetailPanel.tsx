'use client';
import { useMapStore } from '@/store/useMapStore';

export default function DetailPanel() {
  const { selected, setSelected } = useMapStore();
  if (!selected) return null;

  const {
    name, address, category, phone, open_time,
    male_toilet, female_toilet,
    male_disabled, female_disabled,
    emergency_bell, cctv, baby_change,
  } = selected;

  return (
    <div className="absolute left-4 right-4 bottom-4 md:left-1/2 md:translate-x-[-50%] md:right-auto md:w-[900px] z-40">
      <div className="rounded-2xl bg-white/95 shadow-2xl p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="text-sm text-gray-600">{address}</p>
            {category && <p className="text-xs text-gray-500 mt-1">{category}</p>}
          </div>
          <button onClick={() => setSelected(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">✖</button>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><strong>남성 화장실:</strong> {male_toilet}</div>
          <div><strong>여성 화장실:</strong> {female_toilet}</div>
          <div><strong>남성 장애인용:</strong> {male_disabled}</div>
          <div><strong>여성 장애인용:</strong> {female_disabled}</div>
          <div><strong>기저귀 교환대:</strong> {baby_change ? 'O' : 'X'}</div>
          <div><strong>비상벨:</strong> {emergency_bell ? 'O' : 'X'}</div>
          <div><strong>CCTV:</strong> {cctv ? 'O' : 'X'}</div>
        </div>

        <div className="mt-4 border-t pt-3 text-sm text-gray-700 space-y-1">
          <div><strong>개방시간:</strong> {open_time || '정보 없음'}</div>
          <div><strong>전화번호:</strong> {phone || '정보 없음'}</div>
        </div>
      </div>
    </div>
  );
}
