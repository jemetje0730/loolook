'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function FeedbackPage() {
  const t = useTranslations('feedback');
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
        return t('placeholderToiletReport');
      case 'correction':
        return t('placeholderCorrection');
      default:
        return t('placeholderOther');
    }
  };

  return (
    <main className="pt-40 max-w-xl mx-auto px-6 pb-16">
      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-gray-600 mb-8 text-sm whitespace-pre-line">
        {t('subtitle')}
      </p>

      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {t('successMessage')}
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {t('errorMessage')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 카테고리 선택 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('categoryLabel')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'toilet_report', label: t('toiletReport') },
              { id: 'correction', label: t('correction') },
              { id: 'bug', label: t('bug') },
              { id: 'suggestion', label: t('suggestion') },
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
              {t('locationLabel')}
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('locationPlaceholder')}
            />
          </div>
        )}

        {/* 내용 입력 */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('contentLabel')}
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
            {t('emailLabel')}
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-lg bg-black text-white font-bold text-base hover:bg-gray-800 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('submitting') : t('submitButton')}
        </button>
      </form>
    </main>
  );
}