import type { NextConfig } from 'next';

/**
 * Site statik: `npm run build` çıktısı (apps/web/out) sunucu gerektirmez; herhangi bir statik barındırmaya konur.
 * Güvenlik başlıkları (CSP, HSTS) barındırma tarafında verilir.
 */
const nextConfig: NextConfig = {
  output: 'export',
  poweredByHeader: false,
  images: { unoptimized: true },
  // Önizleme derlemesi (PREVIEW=1): dosyalar göreli yoldan yüklensin, site bir alt klasörden de açılabilsin.
  ...(process.env.PREVIEW === '1' ? { assetPrefix: '.' } : {}),
};

export default nextConfig;
