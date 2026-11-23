'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Ozanay'ın fotoğrafı. Sırayla denenir: sitenin kendi dosyası (public/ozanay.jpg), GitHub sitesindeki
 * profile.jpg; ikisi de yoksa ay içinde baş harf görünür.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const SOURCES = [
  process.env.NEXT_PUBLIC_PROFILE_PHOTO_URL ?? `${BASE}/ozanay.jpg`,
  'https://ozanaycelik.github.io/assets/img/profile.jpg',
];

export function Portrait() {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  const failed = i >= SOURCES.length;
  // Sayfa hazır olmadan yükleme başarısız olduysa onError kaçmış olabilir.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setI((n) => n + 1);
  }, [i]);
  return (
    <div className="flex h-[260px] w-[260px] items-center justify-center overflow-hidden rounded-full border-2 border-[var(--mv-logo-moon)] bg-surface shadow-[0_0_60px_color-mix(in_srgb,var(--mv-logo-moon)_25%,transparent)]">
      {failed ? (
        <span aria-hidden="true" className="font-heading text-7xl font-semibold text-accent-text">
          O
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- statik site, görsel olduğu gibi sunulur
        <img
          key={SOURCES[i]}
          ref={ref}
          src={SOURCES[i]}
          alt="Ozanay'ın fotoğrafı"
          width={260}
          height={260}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setI((n) => n + 1)}
        />
      )}
    </div>
  );
}
