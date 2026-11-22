import { migrate } from './migrate';

// Migration tabloların sahibi olan kullanıcıyla çalışır; uygulamanın kullanıcısıyla değil.
const url = process.env.MIGRATION_DATABASE_URL;
if (!url) {
  console.error('MIGRATION_DATABASE_URL eksik');
  process.exit(1);
}
migrate(url)
  .then((applied) => console.log(applied.length ? `Uygulandı: ${applied.join(', ')}` : 'Şema güncel.'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
