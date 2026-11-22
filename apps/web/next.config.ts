import type { NextConfig } from 'next';

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Ozan'ın fotoğrafı şimdilik GitHub sitesinden (bkz. components/portrait.tsx).
  "img-src 'self' data: https://ozanaycelik.github.io",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  // /api/* istekleri aynı adresten API'ye gider: çerez aynı sitede kalır.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Önce yalnız raporlayan kip: nonce'lu zorunlu CSP'ye geçmeden ne kırılacağını görmek için.
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
          ...(process.env.NODE_ENV === 'production'
            ? // Alt alan adları (firmalar) kapsam dışı: includeSubDomains/preload Ozan'ın kararı.
              [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
