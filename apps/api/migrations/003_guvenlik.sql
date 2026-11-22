-- 003: güvenlik incelemesi düzeltmeleri.

-- KVKK kayıtları yalnız eklemeye açık: tablo sahibi dahil kimse güncelleyemez, silemez, boşaltamaz.
CREATE FUNCTION mv_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% tablosu yalnız eklemeye açık', TG_TABLE_NAME;
END
$$;
CREATE TRIGGER append_only BEFORE UPDATE OR DELETE ON legal_acknowledgements FOR EACH ROW EXECUTE FUNCTION mv_append_only();
CREATE TRIGGER append_only_truncate BEFORE TRUNCATE ON legal_acknowledgements FOR EACH STATEMENT EXECUTE FUNCTION mv_append_only();
CREATE TRIGGER append_only BEFORE UPDATE OR DELETE ON marketing_consents FOR EACH ROW EXECUTE FUNCTION mv_append_only();
CREATE TRIGGER append_only_truncate BEFORE TRUNCATE ON marketing_consents FOR EACH STATEMENT EXECUTE FUNCTION mv_append_only();

-- Üye bağlamındaki politikalar yalnız kodun gerçekten yaptığı kadar.
DROP POLICY own_update ON users;          -- üye bağlamında users güncellenmez
DROP POLICY own_rows ON email_tokens;     -- üyenin kendi token özetlerini görmesine gerek yok
DROP POLICY own_update ON subscriptions;  -- iptal isteği yalnız aşağıdaki fonksiyonla, tek sütun

-- Aboneliği dönem sonunda iptal et: yalnız kendi aboneliği, yalnız cancel_at_period_end.
-- Sahibi migration kullanıcısıdır (BYPASSRLS); sahiplik kontrolü fonksiyonun içinde.
CREATE FUNCTION mv_request_cancel(sub_id uuid) RETURNS boolean
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE subscriptions SET cancel_at_period_end = true
  WHERE id = sub_id AND user_id = mv_user_id() AND status <> 'canceled'
  RETURNING true
$$;
REVOKE ALL ON FUNCTION mv_request_cancel(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mv_request_cancel(uuid) TO mv_app;

-- İstek sınırları (kayıt, giriş, şifre sıfırlama). Yalnız sistem bağlamında.
CREATE TABLE rate_limit_hits (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  at timestamptz NOT NULL
);
CREATE INDEX rate_limit_hits_key_idx ON rate_limit_hits (key, at);
ALTER TABLE rate_limit_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_hits FORCE ROW LEVEL SECURITY;
CREATE POLICY system_all ON rate_limit_hits FOR ALL TO mv_app USING (mv_is_system()) WITH CHECK (mv_is_system());
GRANT SELECT, INSERT, DELETE ON rate_limit_hits TO mv_app;
GRANT USAGE, SELECT ON SEQUENCE rate_limit_hits_id_seq TO mv_app;
