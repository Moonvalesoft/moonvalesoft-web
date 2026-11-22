/**
 * Yürürlükteki yasal belgeler ve sürümleri. Metinleri hukukçu yazar; metin değişince sürüm artar,
 * web'deki sayfa da aynı sürümü gösterir. Kayıtlarda bu sürüm saklanır (docs/uyum-standardi.md).
 */
export type LegalKind = 'aydinlatma' | 'on_bilgilendirme' | 'mesafeli_satis' | 'kampanya_izni' | 'iptal_iade';

export interface LegalDocument {
  kind: LegalKind;
  version: string;
  title: string;
  path: string;
}

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  { kind: 'aydinlatma', version: 'taslak-1', title: 'KVKK Aydınlatma Metni', path: '/kvkk' },
  { kind: 'on_bilgilendirme', version: 'taslak-1', title: 'Ön Bilgilendirme Formu', path: '/on-bilgilendirme' },
  { kind: 'mesafeli_satis', version: 'taslak-1', title: 'Mesafeli Satış Sözleşmesi', path: '/mesafeli-satis' },
  { kind: 'kampanya_izni', version: 'taslak-1', title: 'Ticari Elektronik İleti İzni', path: '/kampanya-izni' },
  { kind: 'iptal_iade', version: 'taslak-1', title: 'İptal ve İade Koşulları', path: '/iptal-iade' },
];

export function currentVersion(kind: LegalKind): string {
  const d = LEGAL_DOCUMENTS.find((x) => x.kind === kind);
  if (!d) throw new Error(`Bilinmeyen belge: ${kind}`);
  return d.version;
}

/** İstek bilgisi: onay ve izin kayıtlarında saklanır, yanıtlarda dönmez. */
export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

export function requestMeta(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): RequestMeta {
  const ua = req.headers['user-agent'];
  return { ip: req.ip ?? null, userAgent: typeof ua === 'string' ? ua.slice(0, 300) : null };
}
