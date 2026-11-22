-- Veritabanı rolleri. Bir kez, süper kullanıcıyla çalıştırılır (docker: db/init/01-roles.sh).
-- Parolalar psql değişkeni olarak verilir: -v migrator_password=... -v api_password=...
--
-- mv_migrator: tabloların sahibi; yalnız migration çalıştırır. BYPASSRLS: FORCE RLS'li tablolarda veri taşıyabilsin.
-- mv_app:      politikaların bağlandığı rol, giriş yapamaz.
-- mv_api:      uygulamanın giriş kullanıcısı; süper kullanıcı değil, BYPASSRLS yok, tablo sahibi değil, mv_app üyesi.
SELECT format('CREATE ROLE mv_migrator LOGIN NOSUPERUSER BYPASSRLS NOCREATEROLE NOCREATEDB PASSWORD %L', :'migrator_password')
  WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mv_migrator') \gexec
SELECT 'CREATE ROLE mv_app NOLOGIN NOSUPERUSER NOBYPASSRLS'
  WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mv_app') \gexec
SELECT format('CREATE ROLE mv_api LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB PASSWORD %L', :'api_password')
  WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mv_api') \gexec
GRANT mv_app TO mv_api;
SELECT format('ALTER DATABASE %I OWNER TO mv_migrator', current_database()) \gexec
ALTER SCHEMA public OWNER TO mv_migrator;
