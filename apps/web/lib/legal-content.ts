import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { marked } from 'marked';
import type { LegalDoc } from './server-api';

/** Hukuk ajanının taslakları (docs/hukuk/taslaklar). Avukat onayından sonra kesin metin buraya gelir. */
const FILES: Record<LegalDoc['kind'], string> = {
  aydinlatma: 'aydinlatma.md',
  on_bilgilendirme: 'on-bilgilendirme.md',
  mesafeli_satis: 'mesafeli-satis.md',
  iptal_iade: 'iptal-iade.md',
  kampanya_izni: 'kampanya-izni.md',
};

const DIR = process.env.LEGAL_TEXT_DIR ?? join(process.cwd(), '..', '..', 'docs', 'hukuk', 'taslaklar');

/** Yayımlanmayacak bölümleri (taslakçı/geliştirici notları, form içi metinler) çıkarır. */
function publicPart(md: string, kind: LegalDoc['kind']): string {
  let lines = md.split('\n').filter((l, i) => !(i < 3 && l.startsWith('TASLAK:')));
  const drop = (re: RegExp) => {
    const out: string[] = [];
    let skipping = false;
    for (const l of lines) {
      if (/^## /.test(l)) skipping = re.test(l);
      if (!skipping) out.push(l);
    }
    lines = out;
  };
  drop(/notlar[ıi]?\b|notları|Kutucuk metni|altında bulunacaklar/i);
  // Başlıktan sonraki künye (belge türü, dayanak, kapsam) ilk '---' çizgisine kadar sürer: yayımlanmaz.
  const h1 = lines.findIndex((l) => l.startsWith('# '));
  const hr = lines.findIndex((l, i) => i > h1 && l.trim() === '---');
  if (h1 >= 0 && hr > h1) lines = [...lines.slice(0, h1 + 1), ...lines.slice(hr + 1)];
  // "> Taslakçı notu…" ile başlayan alıntı blokları yayımlanmaz.
  const kept: string[] = [];
  let inNote = false;
  for (const l of lines) {
    if (l.startsWith('>')) {
      if (/^>\s*\**Taslakçı not/i.test(l)) inNote = true;
      if (inNote) continue;
    } else inNote = false;
    kept.push(l);
  }
  lines = kept;
  if (kind === 'kampanya_izni') lines = lines.map((l) => (l.startsWith('## Sayfa metni') ? '' : l));
  return lines.join('\n');
}

export async function legalHtml(kind: LegalDoc['kind']): Promise<string | null> {
  try {
    const md = await readFile(join(DIR, FILES[kind]), 'utf8');
    // Metinler depodan gelir (bizim yazdığımız), yine de ham HTML'e izin verilmez.
    const safe = publicPart(md, kind).replace(/</g, '&lt;');
    return await marked.parse(safe, { gfm: true });
  } catch {
    return null;
  }
}
