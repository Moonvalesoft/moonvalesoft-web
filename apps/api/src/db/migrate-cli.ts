import { migrate } from './migrate';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL eksik');
  process.exit(1);
}
migrate(url)
  .then((applied) => console.log(applied.length ? `Uygulandı: ${applied.join(', ')}` : 'Şema güncel.'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
