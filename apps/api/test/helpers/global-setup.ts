import { mkdtempSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestProject } from 'vitest/node';
import { Client } from 'pg';
import { migrate } from '../../src/db/migrate';

export const TEMPLATE_DB = 'mv_test_template';

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
  await migrate(u.toString());

  project.provide('adminDbUrl', adminUrl);
  return async () => {
    await stop?.();
  };
}
