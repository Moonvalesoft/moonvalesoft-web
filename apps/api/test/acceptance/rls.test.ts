/**
 * Veritabanı güvenliği (RLS). Kaynak: docs/api.md "Veritabanı güvenliği (RLS)", docs/uyum-standardi.md madde 1.
 * Asla atlanmayacak testler. Tablo listesi sabit yazılmaz, katalogdan çekilir (yeni tablo kendiliğinden kapsanır).
 * Bütün veriler sentetiktir.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestApp,
  type TestApp,
  DEFAULT_PRICES,
  buyAndPay,
  call,
  get,
  login,
  post,
} from './support';

type Scope = { userId: string } | 'system' | 'none';

interface Seeded {
  cookie: string;
  email: string;
  userId: string;
  orderId: string;
  ticketId: string;
}

let t: TestApp;
let A: Seeded;
let B: Seeded;
let tables: string[];

async function seed(tag: string): Promise<Seeded> {
  const b = await buyAndPay(t, { tag });
  const me = await get(t, '/api/me', b.cookie);
  expect(me.status).toBe(200);
  const ticket = await post(t, '/api/tickets', { subject: 'Sentetik konu', message: 'Sentetik destek mesajı.' }, b.cookie);
  expect(ticket.status).toBe(201);
  const c = await call(t, { method: 'PUT', url: '/api/me/consents', body: { marketingEmail: true }, cookie: b.cookie });
  expect(c.status).toBe(200);
  // login_failures için hatalı giriş
  expect((await login(t, b.email, 'yanlis-sifre-0000')).status).toBe(401);
  return { cookie: b.cookie, email: b.email, userId: me.body.id, orderId: b.orderId, ticketId: ticket.body.id };
}

beforeAll(async () => {
  t = await createTestApp({ planPrices: DEFAULT_PRICES });
  A = await seed('rls-a');
  B = await seed('rls-b');
  tables = (
    await t.adminSql(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relname <> 'schema_migrations'
        ORDER BY c.relname`,
    )
  ).map((r) => r.relname as string);
}, 60_000);

afterAll(async () => {
  await t?.close();
});

const asA = (): Scope => ({ userId: A.userId });

describe('RLS kataloğu', () => {
  it('katalogda beklenen tablolar var (liste boş değil)', () => {
    for (const name of [
      'users',
      'sessions',
      'email_tokens',
      'login_failures',
      'orders',
      'payment_events',
      'subscriptions',
      'invoices',
      'tickets',
      'ticket_messages',
      'jobs',
      'legal_acknowledgements',
      'marketing_consents',
    ]) {
      expect(tables).toContain(name);
    }
  });

  it('schema_migrations dışındaki bütün public tablolarda relrowsecurity ve relforcerowsecurity açık', async () => {
    const rows = await t.adminSql(
      `SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relname <> 'schema_migrations'`,
    );
    expect(rows.length).toBe(tables.length);
    const bad = rows.filter((r) => !r.relrowsecurity || !r.relforcerowsecurity).map((r) => r.relname);
    expect(bad, `RLS kapalı tablolar: ${bad.join(', ')}`).toEqual([]);
  });

  it('mv_app rolü: süper kullanıcı değil, BYPASSRLS yok, giriş yapamaz', async () => {
    const rows = await t.adminSql(`SELECT rolsuper, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolname = 'mv_app'`);
    expect(rows).toEqual([{ rolsuper: false, rolbypassrls: false, rolcanlogin: false }]);
  });

  it("mv_app hiçbir tablonun sahibi değildir (sahip RLS'ten muaf olmasın)", async () => {
    const rows = await t.adminSql(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND pg_get_userbyid(c.relowner) = 'mv_app'`,
    );
    expect(rows).toEqual([]);
  });

  it.each(['none', 'system', 'user'] as const)("uygulama sorguları current_user = 'mv_app' ile çalışır (bağlam: %s)", async (k) => {
    const scope: Scope = k === 'user' ? asA() : k;
    const rows = await t.sql('SELECT current_user AS u, session_user AS s', [], scope);
    expect(rows[0].u).toBe('mv_app');
  });

  it("bağlam ayarı işlemden taşmaz: A'dan sonra bağlamsız sorgu yine boş", async () => {
    expect((await t.sql('SELECT * FROM orders', [], asA())).length).toBeGreaterThan(0);
    expect(await t.sql('SELECT * FROM orders', [], 'none')).toEqual([]);
  });
});

describe('bağlamsız (none) sorgu', () => {
  it('veri gerçekten var (test anlamlı): ana tablolarda süper kullanıcı satır görür', async () => {
    for (const name of ['users', 'sessions', 'orders', 'payment_events', 'subscriptions', 'invoices', 'tickets',
      'ticket_messages', 'jobs', 'login_failures', 'legal_acknowledgements', 'marketing_consents']) {
      const r = await t.adminSql(`SELECT count(*)::int AS n FROM ${name}`);
      expect(r[0].n, name).toBeGreaterThan(0);
    }
  });

  it('her tabloda SELECT 0 satır döner', async () => {
    const leaked: string[] = [];
    for (const name of tables) {
      const rows = await t.sql(`SELECT * FROM "${name}"`, [], 'none');
      if (rows.length > 0) leaked.push(`${name}:${rows.length}`);
    }
    expect(leaked).toEqual([]);
  });

  it('bağlamsız INSERT politika hatası verir', async () => {
    await expect(
      t.sql(
        `INSERT INTO tickets (user_id, subject, status, created_at) VALUES ($1, 'x', 'open', now())`,
        [A.userId],
        'none',
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("üye bağlamı (A): WHERE yazmadan B'nin satırı görünmez", () => {
  const userTables = [
    'orders',
    'subscriptions',
    'invoices',
    'tickets',
    'legal_acknowledgements',
    'marketing_consents',
    'sessions',
  ];

  it.each(userTables)('%s: yalnız A satırları; A kendi satırlarını görür', async (name) => {
    const rows = await t.sql(`SELECT * FROM ${name}`, [], asA());
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.user_id === A.userId)).toBe(true);
    expect(rows.some((r) => r.user_id === B.userId)).toBe(false);
  });

  it('users: yalnız kendi satırı', async () => {
    const rows = await t.sql('SELECT id FROM users', [], asA());
    expect(rows).toEqual([{ id: A.userId }]);
  });

  it("ticket_messages: yalnız A'nın talebinin mesajları", async () => {
    const rows = await t.sql('SELECT ticket_id FROM ticket_messages', [], asA());
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.ticket_id === A.ticketId)).toBe(true);
  });

  it("B'nin kaydı id ile istense bile görünmez", async () => {
    expect(await t.sql('SELECT * FROM orders WHERE id = $1', [B.orderId], asA())).toEqual([]);
    expect(await t.sql('SELECT * FROM tickets WHERE id = $1', [B.ticketId], asA())).toEqual([]);
    expect(await t.sql('SELECT * FROM ticket_messages WHERE ticket_id = $1', [B.ticketId], asA())).toEqual([]);
  });

  it.each(['login_failures', 'payment_events', 'jobs'])('%s üye bağlamında 0 satır', async (name) => {
    expect(await t.sql(`SELECT * FROM ${name}`, [], asA())).toEqual([]);
  });

  it("email_tokens: B'nin token'ı görünmez", async () => {
    const rows = await t.sql('SELECT user_id FROM email_tokens', [], asA());
    expect(rows.every((r) => r.user_id === A.userId)).toBe(true);
  });

  it("A bağlamında toplu UPDATE B'nin aboneliğine dokunmaz", async () => {
    const rows = await t.sql('UPDATE subscriptions SET seats = seats RETURNING user_id', [], asA());
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.user_id === A.userId)).toBe(true);
  });

  it("A bağlamında toplu DELETE B'nin oturumunu silmez", async () => {
    const before = await t.adminSql('SELECT count(*)::int AS n FROM sessions WHERE user_id = $1', [B.userId]);
    await t.sql('DELETE FROM sessions WHERE user_id = $1', [B.userId], asA());
    const after = await t.adminSql('SELECT count(*)::int AS n FROM sessions WHERE user_id = $1', [B.userId]);
    expect(after).toEqual(before);
    expect((await get(t, '/api/me', B.cookie)).status).toBe(200);
  });
});

describe("üye bağlamı (A): B adına satır yazılamaz", () => {
  it('tickets INSERT (B user_id) → row-level security hatası', async () => {
    await expect(
      t.sql(`INSERT INTO tickets (user_id, subject, status, created_at) VALUES ($1, 'x', 'open', now())`, [B.userId], asA()),
    ).rejects.toThrow(/row-level security/);
  });

  it('orders INSERT (B user_id) → row-level security hatası', async () => {
    await expect(
      t.sql(
        `INSERT INTO orders (user_id, plan_id, seats, amount_kurus, status, created_at)
         VALUES ($1, 'randevu-aylik', 1, 1, 'pending', now())`,
        [B.userId],
        asA(),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('marketing_consents INSERT (B user_id) → row-level security hatası', async () => {
    await expect(
      t.sql(
        `INSERT INTO marketing_consents (user_id, channel, granted, text_version, source, created_at)
         VALUES ($1, 'email', false, 'x', 'panel', now())`,
        [B.userId],
        asA(),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('legal_acknowledgements INSERT (B user_id) → row-level security hatası', async () => {
    await expect(
      t.sql(
        `INSERT INTO legal_acknowledgements (user_id, document, version, accepted_at) VALUES ($1, 'aydinlatma', 'x', now())`,
        [B.userId],
        asA(),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('ticket_messages INSERT (B talebine) → row-level security hatası', async () => {
    await expect(
      t.sql(
        `INSERT INTO ticket_messages (ticket_id, author, body, created_at) VALUES ($1, 'customer', 'x', now())`,
        [B.ticketId],
        asA(),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('A kendi adına bile paid sipariş açamaz (sipariş üyece yalnız pending açılır)', async () => {
    await expect(
      t.sql(
        `INSERT INTO orders (user_id, plan_id, seats, amount_kurus, status, created_at)
         VALUES ($1, 'randevu-aylik', 1, 1, 'paid', now())`,
        [A.userId],
        asA(),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('A kendi adına bile fatura kesemez (invoices INSERT reddedilir; faturayı yalnız sistem keser)', async () => {
    const ev = await t.adminSql(
      `SELECT event_id FROM payment_events WHERE order_id = $1 ORDER BY received_at LIMIT 1`,
      [A.orderId],
    );
    expect(ev.length).toBe(1);
    const before = await t.adminSql('SELECT count(*)::int AS n FROM invoices');
    await expect(
      t.sql(
        `INSERT INTO invoices (number, user_id, order_id, event_id, amount_kurus, issued_at)
         VALUES ('MV-2099-999999', $1, $2, $3, 1, now())`,
        [A.userId, A.orderId, ev[0].event_id],
        asA(),
      ),
    ).rejects.toThrow(/row-level security|permission denied/);
    expect(await t.adminSql('SELECT count(*)::int AS n FROM invoices')).toEqual(before);
  });
});

describe('sistem bağlamı', () => {
  it('sistem bağlamı bütün üyelerin satırlarını görür (sistem işleri çalışabilsin)', async () => {
    const rows = await t.sql('SELECT DISTINCT user_id FROM orders', [], 'system');
    const ids = rows.map((r) => r.user_id);
    expect(ids).toContain(A.userId);
    expect(ids).toContain(B.userId);
  });
});
