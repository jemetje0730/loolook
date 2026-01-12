import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 60,
  },

  // 성능 최적화 - 프로덕션에서 console.log 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 번들 최적화
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },

  // PWA 준비 - 헤더 설정
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
