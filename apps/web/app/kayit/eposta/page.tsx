'use client';

import { useEffect, useState } from 'react';
import { ButtonLink } from '@/components/ui/button';

export default function Page() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    setEmail(sessionStorage.getItem('mv_kayit_eposta'));
  }, []);
  return (
    <div className="container-mv max-w-2xl py-16 md:py-24">
      <h1 role="status" className="text-4xl font-semibold">
        E-postanı kontrol et.
      </h1>
      <p className="mt-5 text-lg text-muted">
        {email ? <strong className="text-fg">{email}</strong> : 'E-posta adresine'} {email ? 'adresine' : ''} bir bağlantı gönderdim.
        Bağlantıya tıkla, hesabın açılsın.
      </p>
      <div className="mt-8 rounded-lg border border-line bg-surface p-6 text-muted">
        <p className="font-semibold text-fg">E-posta gelmedi mi?</p>
        <ul className="mt-2 list-disc pl-5">
          <li>Spam (gereksiz) klasörüne bak.</li>
          <li>Bağlantı 24 saat geçerli.</li>
          <li>Hâlâ gelmediyse [E-POSTA] adresinden bana yaz.</li>
        </ul>
      </div>
      <ButtonLink href="/kayit" variant="outline" className="mt-8">
        Adresi yanlış yazdım
      </ButtonLink>
    </div>
  );
}
