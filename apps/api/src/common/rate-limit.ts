import type { PoolClient } from 'pg';
import { ApiError } from './errors';

/**
 * Kayan pencere sayacı (rate_limit_hits). Aynı anahtara gelen paralel istekler kilit sırasıyla sayılır.
 * Sınır aşılmadıysa isteği kaydeder ve true döner. Sistem bağlamında çağrılır.
 */
export async function hit(c: PoolClient, key: string, limit: number, windowMs: number, now: Date): Promise<boolean> {
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`rl:${key}`]);
  const since = new Date(now.getTime() - windowMs);
  const r = await c.query<{ n: number }>('SELECT count(*)::int AS n FROM rate_limit_hits WHERE key = $1 AND at > $2', [key, since]);
  if ((r.rows[0]?.n ?? 0) >= limit) return false;
  await c.query('INSERT INTO rate_limit_hits (key, at) VALUES ($1, $2)', [key, now]);
  return true;
}

export const tooManyRequests = () =>
  new ApiError(429, 'TOO_MANY_REQUESTS', 'Kısa sürede çok fazla istek geldi. Biraz bekleyip tekrar dene.');
