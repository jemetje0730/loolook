'use client';

export default function MapLoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 z-50">
      <div className="text-center">
        {/* 애니메이션 아이콘 */}
        <div className="mb-6 relative">
          <div className="w-20 h-20 mx-auto">
            {/* 펄싱 배경 */}
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            {/* 회전하는 위치 아이콘 */}
            <div className="relative flex items-center justify-center w-full h-full bg-blue-500 rounded-full animate-spin-slow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
                viewBox="0 0 24 24"
                className="w-10 h-10"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 로딩 텍스트 */}
        <h2 className="text-2xl font-bold text-blue-700 mb-2">
          LooLook
        </h2>
        <p className="text-blue-600 animate-pulse">
          위치를 찾는 중...
        </p>

        {/* 점 애니메이션 */}
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
