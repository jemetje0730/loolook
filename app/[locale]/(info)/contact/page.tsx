'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });

      if (!response.ok) throw new Error('Failed to submit contact message');

      setSubmitStatus('success');
      setEmail('');
      setMessage('');

      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Contact submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pt-40 max-w-2xl mx-auto px-4 pb-16">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-gray-600 mb-8">
        비즈니스 제안, 협업 요청, 파트너십 문의 등 무엇이든 환영합니다.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {/* 왼쪽: 연락처 정보 */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide mb-2">Email</h3>
            <p className="text-sm text-gray-600 hover:underline cursor-pointer">Please fill in the blank!</p>
          </div>
        </div>

        {/* 오른쪽: 폼 */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {submitStatus === 'success' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              메시지가 전송되었습니다. 빠른 시일 내에 답변드리겠습니다!
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              전송에 실패했습니다. 다시 시도해주세요.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">이메일</label>
              <input
                type="email"
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                placeholder="답변 받으실 이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">메시지</label>
              <textarea
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 min-h-[120px] resize-none focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                placeholder="내용을 입력해주세요."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '전송 중...' : '메시지 보내기'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}