'use client';
import { useState } from 'react';

export default function FeedbackPage() {
  const [category, setCategory] = useState('correction');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`[${category}] 피드백이 전송되었습니다.\n\n내용: ${message}\n연락처: ${email || '없음'}`);
    setMessage('');
  };

  return (
    <main className="pt-20 max-w-xl mx-auto px-6 pb-16">
      <h1 className="text-3xl font-bold mb-2">Feedback</h1>
      <p className="text-gray-600 mb-8 text-sm">
        잘못된 정보가 있거나 개선할 점이 있다면 알려주세요.<br/>
        여러분의 제보가 더 나은 지도를 만듭니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 카테고리 선택 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            어떤 내용인가요?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'correction', label: '정보 수정' },
              { id: 'bug', label: '버그 신고' },
              { id: 'suggestion', label: '기능 제안' },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setCategory(type.id)}
                className={`py-2 text-sm font-medium rounded-md border transition-all ${
                  category === type.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 내용 입력 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            상세 내용
          </label>
          <textarea
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none min-h-[150px] resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              category === 'correction' 
                ? "예: 강남역 1번 출구 화장실이 공사 중이라 사용할 수 없습니다." 
                : "자유롭게 내용을 적어주세요."
            }
          />
        </div>

        {/* 이메일 (선택) */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            이메일 (선택)
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="답변을 받고 싶으시다면 이메일을 남겨주세요."
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-lg bg-black text-white font-bold text-base hover:bg-gray-800 transition-colors shadow-lg"
        >
          피드백 보내기
        </button>
      </form>
    </main>
  );
}