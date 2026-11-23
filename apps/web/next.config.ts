import type { NextConfig } from 'next';

/**
 * Site statik: `npm run build` çıktısı (apps/web/out) sunucu gerektirmez; herhangi bir statik barındırmaya konur.
 * Güvenlik başlıkları (CSP, HSTS) barındırma tarafında verilir.
 */
// GitHub Pages: site moonvalesoft.github.io/moonvalesoft-web altında yayınlanır (bkz. .github/workflows/pages.yml).
// Kendi alan adına (moonvalesoft.com) geçince PAGES_BASE_PATH boş bırakılır.
const basePath = process.env.PAGES_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // Önizleme derlemesi (PREVIEW=1): dosyalar göreli yoldan yüklensin, site bir alt klasörden de açılabilsin.
  ...(process.env.PREVIEW === '1' ? { assetPrefix: '.' } : {}),
};

export default nextConfig;
