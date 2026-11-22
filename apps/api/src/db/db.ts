import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

export interface Queryable {
  query<T extends QueryResultRow = any>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
}

/**
 * Sorgunun kim adına çalıştığı. Veritabanındaki RLS politikaları bunu okur:
 * - `{ userId }`: yalnız o üyenin satırları.
 * - `'system'`: ödeme bildirimi, zamanlanmış işler, giriş gibi kimse adına olmayan işler.
 * - `'none'`: bağlam yok; RLS hiçbir satır göstermez, yazdırmaz.
 */
export type DbScope = { userId: string } | 'system' | 'none';

/** Uygulamanın veritabanındaki rolü. Süper kullanıcı değil, BYPASSRLS yok (migrations/002). */
export const APP_ROLE = 'mv_app';

const scopeStore = new AsyncLocalStorage<DbScope>();

function scopeSettings(scope: DbScope): [string, string] {
  if (scope === 'system') return ['', 'on'];
  if (scope === 'none') return ['', ''];
  return [scope.userId, ''];
}

export class Db implements Queryable {
  readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 10 });
  }

  /** `fn` içindeki bütün sorgular bu üye adına çalışır. */
  asUser<R>(userId: string, fn: () => Promise<R>): Promise<R> {
    return scopeStore.run({ userId }, fn);
  }

  /** `fn` içindeki bütün sorgular sistem adına çalışır. Bilerek ve dar kullan. */
  asSystem<R>(fn: () => Promise<R>): Promise<R> {
    return scopeStore.run('system', fn);
  }

  get scope(): DbScope {
    return scopeStore.getStore() ?? 'none';
  }

  /**
   * Her işlem uygulama rolüne geçer ve bağlamı ayarlar (yalnız o işlem için). Rol yoksa hata verir:
   * süper kullanıcı veya tablo sahibi olarak sessizce sorgu çalıştırılmaz, RLS her zaman devrededir.
   */
  private async begin(client: PoolClient, scope: DbScope) {
    const [userId, system] = scopeSettings(scope);
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('role', $1, true), set_config('app.user_id', $2, true), set_config('app.system', $3, true)`,
      [APP_ROLE, userId, system],
    );
  }

  /** Tek sorgu, kendi kısa işleminde, geçerli bağlamla. */
  async query<T extends QueryResultRow = any>(text: string, params?: unknown[]) {
    return this.tx((c) => c.query<T>(text, params));
  }

  async one<T extends QueryResultRow = any>(text: string, params?: unknown[]): Promise<T | undefined> {
    return (await this.query<T>(text, params)).rows[0];
  }

  /** İşlem içinde çalıştırır; hata olursa geri alır. Bağlam işlem başında ayarlanır. */
  async tx<R>(fn: (client: PoolClient) => Promise<R>, scope: DbScope = this.scope): Promise<R> {
    const client = await this.pool.connect();
    let broken: Error | undefined;
    try {
      await this.begin(client, scope);
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      // Geri alma da başarısızsa bağlantı havuza dönmez (yarım kalmış rol/ayar ile tekrar kullanılmasın).
      await client.query('ROLLBACK').catch((e: Error) => {
        broken = e;
      });
      throw err;
    } finally {
      client.release(broken);
    }
  }

  close() {
    return this.pool.end();
  }
}

/** Açık bir işlemin içinde, birkaç sorgu için sistem bağlamına geçer, sonra eski bağlamı geri koyar. */
export async function withSystemScope<R>(client: PoolClient, fn: () => Promise<R>): Promise<R> {
  const prev = (await client.query(`SELECT current_setting('app.user_id', true) AS u, current_setting('app.system', true) AS s`)).rows[0];
  await client.query(`SELECT set_config('app.user_id', '', true), set_config('app.system', 'on', true)`);
  let result: R;
  try {
    result = await fn();
  } catch (err) {
    // İşlem zaten bozuldu ve geri alınacak; ayar işleme özel olduğu için geri yüklemeye gerek yok, asıl hata korunur.
    throw err;
  }
  await client.query(`SELECT set_config('app.user_id', $1, true), set_config('app.system', $2, true)`, [prev.u ?? '', prev.s ?? '']);
  return result;
}
