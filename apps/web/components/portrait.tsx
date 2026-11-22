'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Ozan'ın fotoğrafı, GitHub sitesinden (ozanaycelik.github.io/assets/img/profile.jpg) canlı okunur:
 * oradaki fotoğraf değişince burada da değişir. Fotoğraf yoksa ay içinde baş harf görünür.
 */
export const PROFILE_PHOTO_URL =
  process.env.NEXT_PUBLIC_PROFILE_PHOTO_URL ?? 'https://ozanaycelik.github.io/assets/img/profile.jpg';

export function Portrait() {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Sayfa hazır olmadan yükleme başarısız olduysa onError kaçmış olabilir.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <div className="flex h-[260px] w-[260px] items-center justify-center overflow-hidden rounded-full border-2 border-moon bg-surface shadow-[0_0_60px_color-mix(in_srgb,var(--mv-moon)_20%,transparent)]">
      {failed ? (
        <span aria-hidden="true" className="font-heading text-7xl font-semibold text-accent-text">
          O
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- dış adres, önbelleğe alınmasın diye düz <img>
        <img
          ref={ref}
          src={PROFILE_PHOTO_URL}
          alt="Ozan'ın fotoğrafı"
          width={260}
          height={260}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
