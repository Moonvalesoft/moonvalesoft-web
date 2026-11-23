/**
 * Sitenin bütün içerik ayarları burada. Ürün eklemek, metin değiştirmek ya da Telegram adresini girmek için
 * yalnız bu dosyaya dokunmak yeter.
 */

/** Telegram kullanıcı adı (@ olmadan). NEXT_PUBLIC_TELEGRAM_USERNAME ile de verilebilir. */
export const TELEGRAM_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? '';

/** Telegram sohbetini açar; mesaj kutusu `text` ile önceden dolar (Telegram destekliyorsa). */
export function telegramLink(text?: string): string {
  if (!TELEGRAM_USERNAME) return '#iletisim';
  const base = `https://t.me/${encodeURIComponent(TELEGRAM_USERNAME)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export type IconName = 'calendar' | 'people' | 'home' | 'sync' | 'layers' | 'rules';

/** Ürünün rengi: tokens.json'daki tile* değişkenleri. */
export type Tone = 'moon' | 'violet' | 'teal' | 'water';

export interface Offering {
  /** İleride ürün sayfası adresi olacak: /urunler/<slug> */
  slug: string;
  title: string;
  text: string;
  icon: IconName;
  tone: Tone;
}

export const PRODUCTS: Offering[] = [
  { slug: 'randevu', title: 'Moonvale Randevu', text: 'Online randevu, otomatik hatırlatma ve personel takvimi.', icon: 'calendar', tone: 'moon' },
  { slug: 'crm', title: 'CRM', text: 'Müşteriler, teklifler ve satış hattı tek yerde.', icon: 'people', tone: 'violet' },
  { slug: 'emlak', title: 'Emlak Sistemi', text: 'Portföy yönetimi ve alıcı–ilan eşleştirme.', icon: 'home', tone: 'teal' },
];

export const LOGO_SERVICES: Offering[] = [
  {
    slug: 'logo-erp-entegrasyonu',
    title: 'Logo ERP Entegrasyonu',
    text: 'E-ticaret, pazaryeri ve özel sistemlerle Logo arasında köprü.',
    icon: 'sync',
    tone: 'water',
  },
  {
    slug: 'logo-object-designer',
    title: 'Logo Object Designer ile uyarlama',
    text: 'Tiger serisi ve Bordro Plus için ihtiyacına göre uyarlama.',
    icon: 'layers',
    tone: 'teal',
  },
  {
    slug: 'logo-cloud-connect',
    title: 'Cloud Connect kuralları',
    text: "Logo Cloud Connect'te işine göre kural yazımı.",
    icon: 'rules',
    tone: 'violet',
  },
];

export const quoteText = (title: string) => `Merhaba Ozan, ${title} için teklif almak istiyorum.`;
