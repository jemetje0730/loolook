export default function BlogPage() {
  // 예시 데이터 (나중에 CMS나 API에서 가져오게 됩니다)
  const posts = [
    {
      id: 1,
      title: "LooLook 서비스 오픈 베타 시작",
      date: "2024. 05. 20",
      excerpt: "드디어 LooLook의 첫 번째 버전이 공개되었습니다. 주변 화장실을 찾아보세요.",
    },
    {
      id: 2,
      title: "데이터 업데이트: 서울시 공공데이터 연동",
      date: "2024. 06. 01",
      excerpt: "서울시 내 1,200여 개의 공중화장실 데이터가 추가되었습니다.",
    },
    {
      id: 3,
      title: "사용자 제보 기능 개선 안내",
      date: "2024. 06. 15",
      excerpt: "이제 사진과 함께 화장실 정보를 제보할 수 있습니다.",
    },
  ];

  return (
    <main className="pt-32 max-w-2xl mx-auto px-6 pb-16">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">News & Updates</h1>
        <p className="text-gray-500 mt-2 text-sm">
          LooLook의 새로운 기능과 데이터 업데이트 소식을 전해드립니다.
        </p>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <article 
            key={post.id} 
            className="group block border border-gray-200 rounded-lg p-5 hover:border-black transition-colors cursor-pointer bg-white"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {post.date}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 mb-2">
              {post.title}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {post.excerpt}
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-black group-hover:underline">
              Read more 
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}