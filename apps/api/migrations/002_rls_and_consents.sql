-- 002: Row Level Security ve yasal kayıtlar (docs/uyum-standardi.md).
-- Uygulama mv_app rolüyle çalışır; bu rol süper kullanıcı değildir, RLS'i atlayamaz.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mv_app') THEN
    CREATE ROLE mv_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;
-- Migration'ı çalıştıran kullanıcı (uygulamanın bağlandığı kullanıcı) mv_app'e geçebilsin.
GRANT mv_app TO CURRENT_USER;

-- Yasal belge onayları: aydınlatma (kayıtta), ön bilgilendirme ve mesafeli satış (siparişte). Silinmez, güncellenmez.
CREATE TABLE legal_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  document text NOT NULL CHECK (document IN ('aydinlatma', 'on_bilgilendirme', 'mesafeli_satis')),
  version text NOT NULL,
  order_id uuid REFERENCES orders(id),
  ip text,
  user_agent text,
  accepted_at timestamptz NOT NULL
);
CREATE INDEX legal_acknowledgements_user_idx ON legal_acknowledgements (user_id, accepted_at DESC);

-- Kampanya (ticari elektronik ileti) izni: her değişiklik yeni satır. Güncel durum = kanaldaki son satır.
CREATE TABLE marketing_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'call')),
  granted boolean NOT NULL,
  text_version text NOT NULL,
  source text NOT NULL CHECK (source IN ('register', 'panel', 'unsubscribe_link')),
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL,
  seq bigserial NOT NULL
);
CREATE INDEX marketing_consents_user_idx ON marketing_consents (user_id, channel, created_at DESC, seq DESC);

-- Bağlam yardımcıları. Ayar yoksa boş döner; boş user_id NULL olur, hiçbir satırla eşleşmez.
CREATE FUNCTION mv_user_id() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;
CREATE FUNCTION mv_is_system() RETURNS boolean LANGUAGE sql STABLE AS
  $$ SELECT coalesce(current_setting('app.system', true), '') = 'on' $$;

-- Yetkiler: yalnız gereken kadar.
GRANT USAGE ON SCHEMA public TO mv_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mv_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mv_app;
REVOKE ALL ON schema_migrations FROM mv_app;
-- Kayıt tabloları değiştirilemez, silinemez.
REVOKE UPDATE, DELETE ON legal_acknowledgements, marketing_consents FROM mv_app;
GRANT EXECUTE ON FUNCTION mv_user_id(), mv_is_system() TO mv_app;
-- Sonradan eklenen tablolar da yetki alsın; RLS testi yeni tabloda RLS açılmadıysa yakalar.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mv_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO mv_app;

-- Bütün tablolarda RLS açık ve tablo sahibi için de zorunlu.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations' LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    -- Sistem işleri her tabloda çalışabilir.
    EXECUTE format('CREATE POLICY system_all ON %I FOR ALL TO mv_app USING (mv_is_system()) WITH CHECK (mv_is_system())', t);
  END LOOP;
END
$$;

-- Üye bağlamı: yalnız kendi satırları. login_failures, payment_events, jobs için üye politikası yok (görünmez).
CREATE POLICY own_row ON users FOR SELECT TO mv_app USING (id = mv_user_id());
CREATE POLICY own_update ON users FOR UPDATE TO mv_app USING (id = mv_user_id()) WITH CHECK (id = mv_user_id());

CREATE POLICY own_rows ON sessions FOR ALL TO mv_app USING (user_id = mv_user_id()) WITH CHECK (user_id = mv_user_id());
CREATE POLICY own_rows ON email_tokens FOR SELECT TO mv_app USING (user_id = mv_user_id());

CREATE POLICY own_select ON orders FOR SELECT TO mv_app USING (user_id = mv_user_id());
CREATE POLICY own_insert ON orders FOR INSERT TO mv_app WITH CHECK (user_id = mv_user_id() AND status = 'pending');

CREATE POLICY own_select ON subscriptions FOR SELECT TO mv_app USING (user_id = mv_user_id());
CREATE POLICY own_update ON subscriptions FOR UPDATE TO mv_app USING (user_id = mv_user_id()) WITH CHECK (user_id = mv_user_id());

CREATE POLICY own_select ON invoices FOR SELECT TO mv_app USING (user_id = mv_user_id());

CREATE POLICY own_select ON tickets FOR SELECT TO mv_app USING (user_id = mv_user_id());
CREATE POLICY own_insert ON tickets FOR INSERT TO mv_app WITH CHECK (user_id = mv_user_id() AND status = 'open');

-- Mesajlar, talep üzerinden: tickets'ın kendi politikası alt sorguda da geçerli.
CREATE POLICY own_select ON ticket_messages FOR SELECT TO mv_app
  USING (EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_id));
CREATE POLICY own_insert ON ticket_messages FOR INSERT TO mv_app
  WITH CHECK (author = 'customer' AND EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_id));

CREATE POLICY own_select ON legal_acknowledgements FOR SELECT TO mv_app USING (user_id = mv_user_id());
CREATE POLICY own_insert ON legal_acknowledgements FOR INSERT TO mv_app WITH CHECK (user_id = mv_user_id());

CREATE POLICY own_select ON marketing_consents FOR SELECT TO mv_app USING (user_id = mv_user_id());
CREATE POLICY own_insert ON marketing_consents FOR INSERT TO mv_app WITH CHECK (user_id = mv_user_id());
