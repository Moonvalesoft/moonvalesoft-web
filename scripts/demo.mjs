#!/usr/bin/env node
/**
 * Yerel deneme: Docker ve sunucu gerekmez. `npm run demo`
 *
 * - Gömülü PostgreSQL'i .demo/ klasöründe başlatır (veriler kapatınca da durur; silmek için .demo klasörünü sil).
 * - Rolleri (db/roles.sql) kurar, migration'ları mv_migrator ile çalıştırır.
 * - API'yi (4000) mv_api kullanıcısıyla, siteyi (3000) geliştirme kipinde açar.
 * - E-postalar terminale yazılır: doğrulama bağlantısına oradan tıkla.
 * - Ödeme sahte sağlayıcıyla yapılır; gerçek para çekilmez.
 *
 * Fiyatlar henüz belirlenmedi. Akışı denemek için Randevu'ya DENEME fiyatı verilir; istersen değiştir:
 *   DEMO_PLAN_PRICES="randevu-aylik=100000" npm run demo   (kuruş; 100000 = 1.000 TL)
 */
import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'apps/api/package.json'));
const { default: EmbeddedPostgres } = await import(require.resolve('embedded-postgres'));
const pg = require('pg');

const PORT = 54329;
const DB = 'moonvale_demo';
const PW = { admin: 'demo', migrator: 'mv_migrator_demo', api: 'mv_api_demo' };
const dataDir = join(root, '.demo', 'pgdata');
const fresh = !existsSync(dataDir);
mkdirSync(join(root, '.demo'), { recursive: true });
// Linux'ta root olarak çalışırken PostgreSQL ayrı kullanıcıya geçer; klasöre yazabilsin.
if (process.getuid?.() === 0) chmodSync(join(root, '.demo'), 0o777);

const say = (m) => console.log(`\x1b[33m[demo]\x1b[0m ${m}`);

const server = new EmbeddedPostgres({ databaseDir: dataDir, user: 'postgres', password: PW.admin, port: PORT, persistent: true, onLog: () => {} });
if (fresh) {
  say('Veritabanı ilk kez hazırlanıyor (bir dakika sürebilir)…');
  await server.initialise();
}
await server.start();
const adminUrl = (db) => `postgres://postgres:${PW.admin}@localhost:${PORT}/${db}`;
const url = (user, pw) => `postgres://${user}:${pw}@localhost:${PORT}/${DB}`;

if (fresh) await server.createDatabase(DB);

// Roller: db/roles.sql'deki \gexec satırları psql olmadan çalıştırılır.
const rolesSql = readFileSync(join(root, 'apps/api/db/roles.sql'), 'utf8')
  .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
  .replace(/:'migrator_password'/g, `'${PW.migrator}'`).replace(/:'api_password'/g, `'${PW.api}'`);
const admin = new pg.Client({ connectionString: adminUrl(DB) });
await admin.connect();
for (const part of rolesSql.split(/\\gexec|;/)) {
  const s = part.trim();
  if (!s) continue;
  await admin.query(s.startsWith('SELECT') ? `DO $do$ DECLARE c text; BEGIN FOR c IN ${s} LOOP EXECUTE c; END LOOP; END $do$` : s);
}
await admin.end();

const env = {
  ...process.env,
  NODE_ENV: 'development',
  DATABASE_URL: url('mv_api', PW.api),
  MIGRATION_DATABASE_URL: url('mv_migrator', PW.migrator),
  MIGRATE_ON_START: 'true',
  WEB_ORIGIN: 'http://localhost:3000',
  API_PORT: '4000',
  API_INTERNAL_URL: 'http://localhost:4000',
  PLAN_PRICES: process.env.DEMO_PLAN_PRICES ?? 'randevu-aylik=100000',
  PAYMENT_PROVIDER: 'fake',
  PAYMENT_WEBHOOK_SECRET: 'yerel-deneme-yerel-deneme-yerel-deneme',
  DEV_FAKE_PAYMENTS: 'true',
  NEXT_PUBLIC_DEV_FAKE_PAYMENTS: 'true',
  SMTP_URL: 'console',
  ADMIN_EMAIL: process.env.DEMO_ADMIN_EMAIL ?? 'ozan@yerel.test',
  TRUSTED_PROXIES: '127.0.0.1,::1',
};

const children = [];
function run(name, args) {
  const p = spawn('npm', args, { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' });
  p.on('exit', (code) => say(`${name} kapandı (${code ?? 'sinyal'})`));
  children.push(p);
}
run('API', ['run', 'dev', '-w', '@moonvalesoft/api']);
run('Site', ['run', 'dev', '-w', '@moonvalesoft/web']);

say('Site birazdan hazır: http://localhost:3000');
say(`Randevu DENEME fiyatı: ${env.PLAN_PRICES} (kuruş). Gerçek fiyat değil.`);
say('E-postalar bu pencereye yazılır. Kapatmak için Ctrl+C.');

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  say('Kapatılıyor…');
  for (const c of children) c.kill();
  await server.stop().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
