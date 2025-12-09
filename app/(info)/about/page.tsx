export default function AboutPage() {
  return (
    <main className="pt-20 max-w-3xl mx-auto px-4 pb-16">
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

      {/* 통계 섹션 (UK Map 스타일) */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
          <span className="block text-3xl font-bold text-black mb-1">1,240+</span>
          <span className="text-sm text-gray-500">등록된 화장실</span>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
          <span className="block text-3xl font-bold text-black mb-1">Free</span>
          <span className="text-sm text-gray-500">오픈소스 프로젝트</span>
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