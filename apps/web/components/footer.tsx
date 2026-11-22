import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-mv flex flex-wrap justify-between gap-4 py-10 text-sm text-subtle">
        <span>© {new Date().getFullYear()} Moonvalesoft · İstanbul</span>
        <nav aria-label="Yasal" className="flex flex-wrap gap-x-6 gap-y-2 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center">
          <Link href="/kvkk">KVKK</Link>
          <Link href="/mesafeli-satis">Mesafeli satış sözleşmesi</Link>
          <Link href="/on-bilgilendirme">Ön bilgilendirme formu</Link>
          <Link href="/iptal-iade">İptal ve iade</Link>
          <Link href="/kampanya-izni">Kampanya izni</Link>
        </nav>
      </div>
    </footer>
  );
}
