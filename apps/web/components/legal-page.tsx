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
  const docs = await serverApi<LegalDoc[]>('/api/legal');
  const doc = docs?.find((d) => d.kind === kind);
  const o = OUTLINE[kind];
  return (
    <article className="container-mv max-w-3xl py-14 md:py-20">
      <h1 className="text-4xl font-semibold">{doc?.title ?? title}</h1>
      {doc && <p className="mt-2 text-sm text-subtle">Sürüm: {doc.version}</p>}
      <div role="note" className="mt-8 rounded-lg border border-secondary bg-surface p-6">
        <p className="font-semibold">Metin hukukçudan gelecek.</p>
        <p className="mt-2 text-muted">{o.intro} Kesin metin hazır olunca bu sayfa güncellenecek ve sürüm numarası değişecek.</p>
      </div>
      <h2 className="mb-3 mt-10 font-sans text-xl font-semibold">Bu metinde yer alacaklar</h2>
      <ul className="list-disc pl-6 text-muted">
        {o.items.map((i) => (
          <li key={i} className="mt-1.5">
            {i}
          </li>
        ))}
      </ul>
    </article>
  );
}
