'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  return (
    <main className="pt-40 max-w-2xl mx-auto px-4 pb-16">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-gray-600 mb-8">
        버그 제보, 데이터 수정 요청, 파트너십 문의 등 무엇이든 환영합니다.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {/* 왼쪽: 연락처 정보 */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide mb-2">Email</h3>
            <p className="text-sm text-gray-600 hover:underline cursor-pointer">hello@loolook.com</p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide mb-2">Social</h3>
            <p className="text-sm text-gray-600">@loolook_map</p>
          </div>
        </div>

        {/* 오른쪽: 폼 */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium mb-1">이메일</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50"
                placeholder="답변 받으실 이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">메시지</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 min-h-[120px]"
                placeholder="내용을 입력해주세요."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button className="w-full bg-black text-white py-2.5 rounded-md text-sm font-medium hover:bg-gray-800">
              메시지 보내기
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}