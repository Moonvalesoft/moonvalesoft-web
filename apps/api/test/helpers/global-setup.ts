import { mkdtempSync, chmodSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestProject } from 'vitest/node';
import { Client } from 'pg';
import { migrate } from '../../src/db/migrate';

export const TEMPLATE_DB = 'mv_test_template';
/** Üretimdeki gibi: migration mv_migrator ile, uygulama mv_api ile (db/roles.sql). */
export const TEST_ROLE_PASSWORDS = { migrator: 'mv_migrator_test', api: 'mv_api_test' };

declare module 'vitest' {
  export interface ProvidedContext {
    adminDbUrl: string;
  }
}

/**
 * Testler gerçek PostgreSQL ile çalışır. TEST_DATABASE_URL verilmişse (CI) o sunucu kullanılır;
 * verilmemişse geçici bir gömülü PostgreSQL başlatılır. Şema bir kez şablon veritabanına kurulur,
 * her createTestApp şablondan kendi boş veritabanını kopyalar.
 */
export default async function setup(project: TestProject) {
  let adminUrl = process.env.TEST_DATABASE_URL;
  let stop: (() => Promise<void>) | undefined;

  if (!adminUrl) {
    const { default: EmbeddedPostgres } = await import('embedded-postgres');
    const dir = mkdtempSync(join(tmpdir(), 'mv-pg-'));
    chmodSync(dir, 0o777);
    const port = 55000 + Math.floor(Math.random() * 5000);
    const pg = new EmbeddedPostgres({
      databaseDir: join(dir, 'data'),
      user: 'postgres',
      password: 'postgres',
      port,
      persistent: false,
      onLog: () => undefined,
    });
    await pg.initialise();
    await pg.start();
    adminUrl = `postgres://postgres:postgres@localhost:${port}/postgres`;
    stop = async () => {
      await pg.stop();
      rmSync(dir, { recursive: true, force: true });
    };
  }

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB}`);
  await admin.query(`CREATE DATABASE ${TEMPLATE_DB}`);
  await admin.end();
  const u = new URL(adminUrl);
  u.pathname = `/${TEMPLATE_DB}`;
  // Rolleri gerçek betikle kur (psql değişkenleri elle doldurulur).
  const roles = readFileSync(join(__dirname, '..', '..', 'db', 'roles.sql'), 'utf8');
  const t = new Client({ connectionString: u.toString() });
  await t.connect();
  for (const stmt of rolesStatements(roles, TEST_ROLE_PASSWORDS)) await t.query(stmt);
  await t.end();
  const m = new URL(u.toString());
  m.username = 'mv_migrator';
  m.password = TEST_ROLE_PASSWORDS.migrator;
  await migrate(m.toString());

  project.provide('adminDbUrl', adminUrl);
  return async () => {
    await stop?.();
  };
}

/** db/roles.sql'i psql olmadan çalıştırmak için: \gexec satırlarını üretip sırayla döndürür. */
function rolesStatements(sql: string, pw: { migrator: string; api: string }): string[] {
  const lit = (v: string) => `'${v.replace(/'/g, "''")}'`;
  const body = sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .replace(/:'migrator_password'/g, lit(pw.migrator))
    .replace(/:'api_password'/g, lit(pw.api));
  const out: string[] = [];
  for (const part of body.split(/\\gexec|;/)) {
    const s = part.trim();
    if (!s) continue;
    // "SELECT <üretilen komut> WHERE ..." biçimindekiler \gexec ile çalışıyordu: burada ürettirip çalıştırıyoruz.
    out.push(s.startsWith('SELECT') ? `DO $do$ DECLARE c text; BEGIN FOR c IN ${s} LOOP EXECUTE c; END LOOP; END $do$` : s);
  }
  return out;
}
