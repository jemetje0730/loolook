'use client';
import { useMapStore } from '@/store/useMapStore';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

export default function DetailPanel() {
  const { selected, setSelected } = useMapStore();
  const t = useTranslations('detail');
  const locale = useLocale();

  const [translatedName, setTranslatedName] = useState<string>('');
  const [translatedAddress, setTranslatedAddress] = useState<string>('');
  const [translatedCategory, setTranslatedCategory] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  // 한국어가 아닌 경우 텍스트를 영어로 번역
  useEffect(() => {
    if (!selected) {
      setIsReady(false);
      return;
    }

    const { name, address, category } = selected;

    if (locale === 'ko') {
      // 한국어는 원본 그대로
      setTranslatedName(name || '');
      setTranslatedAddress(address || '');
      setTranslatedCategory(category || '');
      setIsReady(true);
      return;
    }

    // 번역 시작 - 아직 준비 안됨
    setIsReady(false);

    // 영어, 중국어, 일본어는 영어로 번역
    const translateToEnglish = async (text: string): Promise<string> => {
      if (!text) return '';

      try {
        // Google Translate API를 사용한 번역
        const response = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(text)}`
        );
        const data = await response.json();

        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0][0][0];
        }
        return text;
      } catch (error) {
        console.error('Translation error:', error);
        return text; // 번역 실패 시 원문 반환
      }
    };

    // 병렬로 번역 요청
    Promise.all([
      translateToEnglish(name || ''),
      translateToEnglish(address || ''),
      translateToEnglish(category || ''),
    ]).then(([translatedNameResult, translatedAddressResult, translatedCategoryResult]) => {
      setTranslatedName(translatedNameResult);
      setTranslatedAddress(translatedAddressResult);
      setTranslatedCategory(translatedCategoryResult);
      setIsReady(true);
    });
  }, [locale, selected]);

  // 선택된 항목이 없거나 번역 준비가 안되면 아무것도 렌더링하지 않음
  if (!selected || !isReady) return null;

  const {
    name, address, category, phone, open_time,
    male_toilet, female_toilet,
    male_disabled, female_disabled,
    emergency_bell, cctv, baby_change,
  } = selected;

  // 한국어가 아닌 경우, 데이터 값들을 영어로 변환
  const translateValue = (value: string | null | undefined): string | null => {
    if (!value) return null;
    if (locale === 'ko') return value; // 한국어는 그대로 반환

    // 영어, 중국어, 일본어는 한국어 데이터를 영어로 변환
    const translations: { [key: string]: string } = {
      '연중무휴': 'Open 24/7',
      '상시(24시간)': 'Open 24/7',
      '정보 없음': 'No information',
      '정보없음': 'No information',
      '정시(영업시작~종료)': 'During business hours',
    };

    return translations[value] || value;
  };

  // O/X 값 표시 (한국어가 아닌 경우 그대로 O/X 유지)
  const yesNoValue = (value: boolean | string | null | undefined): string => {
    if (locale === 'ko') {
      return value ? 'O' : 'X';
    }
    // 영어, 중국어, 일본어는 O/X 그대로 표시
    return value ? 'O' : 'X';
  };

  // 표시할 텍스트 결정 (번역된 텍스트 또는 원본)
  const displayName = locale === 'ko' ? name : (translatedName || name);
  const displayAddress = locale === 'ko' ? address : (translatedAddress || address);
  const displayCategory = locale === 'ko' ? category : (translatedCategory || category);

  return (
    <div className="absolute left-4 right-4 bottom-4 md:left-1/2 md:translate-x-[-50%] md:right-auto md:w-[900px] z-40">
      <div className="rounded-2xl bg-white/95 shadow-2xl p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-sm text-gray-600">{displayAddress}</p>
            {displayCategory && <p className="text-xs text-gray-500 mt-1">{displayCategory}</p>}
          </div>
          <button onClick={() => setSelected(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">✖</button>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><strong>{t('maleToilet')}:</strong> {male_toilet}</div>
          <div><strong>{t('femaleToilet')}:</strong> {female_toilet}</div>
          <div><strong>{t('maleDisabled')}:</strong> {male_disabled}</div>
          <div><strong>{t('femaleDisabled')}:</strong> {female_disabled}</div>
          <div><strong>{t('babyChange')}:</strong> {yesNoValue(baby_change)}</div>
          <div><strong>{t('emergencyBell')}:</strong> {yesNoValue(emergency_bell)}</div>
          <div><strong>{t('cctv')}:</strong> {yesNoValue(cctv)}</div>
        </div>

        <div className="mt-4 border-t pt-3 text-sm text-gray-700 space-y-1">
          <div><strong>{t('openTime')}:</strong> {translateValue(open_time) || (locale === 'ko' ? '정보 없음' : 'No information')}</div>
          <div><strong>{t('phone')}:</strong> {phone || (locale === 'ko' ? '정보 없음' : 'No information')}</div>
        </div>
      </div>
    </div>
  );
}
