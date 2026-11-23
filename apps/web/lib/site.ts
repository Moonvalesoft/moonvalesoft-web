/**
 * Sitenin iletişim ayarları. Ürün ve metinler: ./offerings.ts
 */
export * from './offerings';

/** Ozanay'ın kendi Telegram kullanıcı adı (bot yokken kullanılır). */
export const TELEGRAM_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? 'ozanay24';

/**
 * Telegram botunun kullanıcı adı (@ olmadan, ör. MoonvalesoftBot). Verilirse bütün düğmeler bota gider:
 * bot teklif / şikâyet / öneri seçtirir, talebi Ozanay'a iletir. Boşsa düğmeler doğrudan Ozanay'ın sohbetini açar.
 */
export const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? '';

const tme = (name: string) => `https://t.me/${encodeURIComponent(name)}`;

export const quoteText = (title: string) => `Merhaba Ozanay, ${title} için teklif almak istiyorum.`;

/** "Bana yaz" düğmeleri. */
export function contactLink(): string {
  if (TELEGRAM_BOT) return `${tme(TELEGRAM_BOT)}?start=menu`;
  return TELEGRAM_USERNAME ? tme(TELEGRAM_USERNAME) : '#iletisim';
}

/** Bir ürünün "Teklif al" düğmesi: botta ürün seçili açılır. */
export function quoteLink(slug: string, title: string): string {
  if (TELEGRAM_BOT) return `${tme(TELEGRAM_BOT)}?start=${encodeURIComponent(`t-${slug}`)}`;
  if (!TELEGRAM_USERNAME) return '#iletisim';
  return `${tme(TELEGRAM_USERNAME)}?text=${encodeURIComponent(quoteText(title))}`;
}
