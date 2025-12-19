'use client';
import { useState } from 'react';

export default function FeedbackPage() {
  const [category, setCategory] = useState('toilet_report');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          email: email || null,
          location: location || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setSubmitStatus('success');
      setMessage('');
      setEmail('');
      setLocation('');

      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Feedback submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    switch (category) {
      case 'toilet_report':
        return "예: 강남역 3번 출구 근처에 공중화장실이 있습니다.\n위치: 서울시 강남구 강남대로 지하 396\n시설: 남녀 분리, 장애인 화장실 있음";
      case 'correction':
        return "예: 강남역 1번 출구 화장실이 현재 공사 중이라 사용할 수 없습니다.";
      default:
        return "자유롭게 내용을 적어주세요.";
    }
  };

  return (
    <main className="pt-40 max-w-xl mx-auto px-6 pb-16">
      <h1 className="text-3xl font-bold mb-2">Feedback & Report</h1>
      <p className="text-gray-600 mb-8 text-sm">
        새로운 화장실을 발견하셨나요? 잘못된 정보가 있거나 개선할 점이 있다면 알려주세요.<br/>
        여러분의 제보가 더 나은 지도를 만듭니다.
      </p>

      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          제보해주셔서 감사합니다! 검토 후 반영하겠습니다.
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          전송에 실패했습니다. 다시 시도해주세요.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 카테고리 선택 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            어떤 내용인가요?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'toilet_report', label: '화장실 제보' },
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

        {/* 화장실 제보 시 위치 입력 필드 */}
        {category === 'toilet_report' && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              위치 (주소 또는 랜드마크)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 강남역 3번 출구, 서울시 강남구 강남대로 396"
            />
          </div>
        )}

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
            placeholder={getPlaceholder()}
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
          disabled={isSubmitting}
          className="w-full py-4 rounded-lg bg-black text-white font-bold text-base hover:bg-gray-800 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '전송 중...' : '제보하기'}
        </button>
      </form>
    </main>
  );
}