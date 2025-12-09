'use client';

import { useEffect, useState } from 'react';

// 중복 로딩 방지용 전역 Promise
let kakaoLoadPromise: Promise<void> | null = null;

export function useKakaoLoader(appKey: string) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!appKey) {
      console.error('KAKAO JS KEY missing');
      return;
    }
    if (typeof window === 'undefined') return;

    // 이미 준비된 경우
    if (window.kakao?.maps && window.kakao.maps.services && window.kakao.maps.MarkerClusterer) {
      setReady(true);
      return;
    }

    if (!kakaoLoadPromise) {
      kakaoLoadPromise = new Promise<void>((resolve, reject) => {
        const scriptId = 'kakao-sdk';
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer,services`;
          script.onload = () => {
            if (!window.kakao?.maps) {
              reject(new Error('kakao.maps not found after script load'));
              return;
            }
            window.kakao.maps.load(() => resolve());
          };
          script.onerror = () => reject(new Error('Kakao SDK load failed'));
          document.head.appendChild(script);
        } else {
          // 이미 script 태그는 있는데 kakao만 아직 준비 안 된 경우
          if (window.kakao?.maps) {
            window.kakao.maps.load(() => resolve());
          } else {
            script.onload = () => {
              if (!window.kakao?.maps) {
                reject(new Error('kakao.maps not found after script load'));
                return;
              }
              window.kakao.maps.load(() => resolve());
            };
          }
        }
      });
    }

    kakaoLoadPromise
      .then(() => setReady(true))
      .catch((e) => console.error('Kakao SDK load error:', e));
  }, [appKey]);

  return ready;
}
