import { legalHtml } from '@/lib/legal-content';
import { serverApi, type LegalDoc } from '@/lib/server-api';

/** Hukukçudan metin gelene kadar ne yazacağını söyleyen yer tutucu. Hukuki cümle uydurulmaz. */
const OUTLINE: Record<LegalDoc['kind'], { intro: string; items: string[] }> = {
  aydinlatma: {
    intro: 'Kişisel verilerini nasıl işlediğimi burada anlatacağım.',
    items: [
      'Veri sorumlusu: Moonvalesoft ve iletişim bilgileri',
      'Hangi verileri topladığım (ad, e-posta, sipariş ve fatura bilgileri, destek mesajları, IP ve tarayıcı bilgisi)',
      'Hangi amaçla ve hangi hukuki sebeple işlediğim',
      'Kimlere aktardığım (ödeme şirketi, e-posta hizmeti, sunucu) ve yurt dışına aktarım olup olmadığı',
      'Ne kadar süre sakladığım',
      'KVKK 11. madde kapsamındaki hakların ve başvuru yolun',
    ],
  },
  on_bilgilendirme: {
    intro: 'Satın almadan önce bilmen gerekenleri burada anlatacağım.',
    items: [
      'Satıcı bilgileri (unvan, adres, iletişim, vergi ve MERSİS numarası)',
      'Hizmetin temel nitelikleri ve süresi',
      'Vergiler dahil toplam fiyat ve ödeme şekli',
      'Aboneliğin yenilenmesi ve iptali',
      'Cayma hakkı ve kullanılamayacağı durumlar',
      'Şikâyet ve itiraz yolları',
    ],
  },
  mesafeli_satis: {
    intro: 'Seninle aramızdaki satış sözleşmesi burada olacak.',
    items: ['Taraflar', 'Sözleşmenin konusu ve hizmet bilgileri', 'Fiyat, ödeme ve yenileme', 'Hizmetin sunulması', 'Cayma hakkı, iptal ve iade', 'Uyuşmazlıkların çözümü'],
  },
  kampanya_izni: {
    intro: 'Sana kampanya ve yenilik e-postası gönderebilmem için verdiğin iznin metni burada olacak.',
    items: [
      'Hangi iletileri göndereceğim (yeni özellikler, kampanyalar, duyurular)',
      'Hangi kanaldan (e-posta)',
      'İznin isteğe bağlı olduğu; vermesen de hizmetin aynen sürdüğü',
      'İzni nasıl geri alacağın (panelde "İzinlerim" ve her e-postadaki bağlantı)',
    ],
  },
  iptal_iade: {
    intro: 'Aboneliği iptal etme ve iade koşulları burada olacak.',
    items: ['Aboneliği panelden iptal etme', 'Dönem sonuna kadar kullanım', 'İade yapılan ve yapılmayan durumlar', 'İade süresi ve yöntemi'],
  },
};

export async function LegalPage({ kind, title }: { kind: LegalDoc['kind']; title: string }) {
  const [docs, html] = await Promise.all([serverApi<LegalDoc[]>('/api/legal'), legalHtml(kind)]);
  const doc = docs?.find((d) => d.kind === kind);
  const o = OUTLINE[kind];
  return (
    <article className="container-mv max-w-3xl py-14 md:py-20">
      {doc && <p className="text-sm text-subtle">Sürüm: {doc.version}</p>}
      <div role="note" className="my-6 rounded-lg border border-secondary bg-surface p-5">
        <p className="font-semibold">Taslak: avukat onayı bekliyor.</p>
        <p className="mt-1 text-sm text-muted">
          Bu metin henüz kesinleşmedi; köşeli parantezli yerler doldurulacak. Kesin metin yayımlanınca sürüm numarası değişir.
        </p>
      </div>
      {html ? (
        <div className="legal-prose" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <>
          <h1 className="text-4xl font-semibold">{doc?.title ?? title}</h1>
          <p className="mt-4 text-muted">{o.intro}</p>
          <ul className="mt-4 list-disc pl-6 text-muted">
            {o.items.map((i) => (
              <li key={i} className="mt-1.5">
                {i}
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
