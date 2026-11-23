import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { themeInitScript } from '@/components/theme';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Moonvalesoft — işini kolaylaştıran yazılımlar', template: '%s · Moonvalesoft' },
  description: "Randevu, CRM ve emlak yazılımları; Logo ERP entegrasyonu, Object Designer uyarlamaları ve Cloud Connect kuralları. Bana Telegram'dan yaz.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" data-theme="gece" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#icerik" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
          İçeriğe geç
        </a>
        <Header />
        <main id="icerik">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
