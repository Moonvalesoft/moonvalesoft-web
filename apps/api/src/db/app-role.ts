import { Logger } from '@nestjs/common';
import type { Db } from './db';

/**
 * Uygulamanın bağlandığı kullanıcı süper kullanıcı, BYPASSRLS'li veya tablo sahibiyse RLS tek kilit olarak kalır.
 * Üretimde açılmayı reddeder, geliştirmede uyarır (docs/uyum-standardi.md §1).
 */
export async function assertAppRole(db: Db, production: boolean): Promise<void> {
  const r = await db.pool.query(
    `SELECT r.rolsuper, r.rolbypassrls,
            (SELECT count(*) FROM pg_tables t WHERE t.schemaname = 'public' AND t.tableowner = session_user)::int AS owned
     FROM pg_roles r WHERE r.rolname = session_user`,
  );
  const row = r.rows[0];
  const problems = [
    row?.rolsuper && 'süper kullanıcı',
    row?.rolbypassrls && 'BYPASSRLS yetkili',
    row?.owned > 0 && `${row.owned} tablonun sahibi`,
  ].filter(Boolean);
  if (!problems.length) return;
  const msg = `API'nin veritabanı kullanıcısı ${problems.join(', ')}. DATABASE_URL mv_api kullanıcısını göstermeli (db/roles.sql).`;
  if (production) throw new Error(msg);
  new Logger('Db').warn(msg);
}
