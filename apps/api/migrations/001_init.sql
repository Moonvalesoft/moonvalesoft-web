-- Moonvalesoft Web: ilk şema. Zamanlar timestamptz (UTC), tutarlar kuruş (bigint).

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE email_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE TABLE login_failures (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  at timestamptz NOT NULL
);
CREATE INDEX login_failures_email_idx ON login_failures (lower(email), at);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  plan_id text NOT NULL,
  seats integer NOT NULL CHECK (seats >= 1),
  amount_kurus bigint NOT NULL CHECK (amount_kurus >= 0),
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  company_slug text,
  company_name text,
  created_at timestamptz NOT NULL
);
CREATE INDEX orders_user_idx ON orders (user_id);
CREATE INDEX orders_slug_idx ON orders (company_slug);

CREATE TABLE payment_events (
  event_id text PRIMARY KEY,
  order_id text NOT NULL,
  type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  amount_kurus bigint,
  period_end timestamptz,
  valid boolean NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL
);
CREATE INDEX payment_events_order_idx ON payment_events (order_id, occurred_at);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  user_id uuid NOT NULL REFERENCES users(id),
  plan_id text NOT NULL,
  product text NOT NULL,
  seats integer NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  company_slug text,
  provisioning text NOT NULL DEFAULT 'none' CHECK (provisioning IN ('none', 'pending', 'done', 'failed')),
  created_at timestamptz NOT NULL
);
CREATE INDEX subscriptions_user_idx ON subscriptions (user_id);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  event_id text NOT NULL UNIQUE REFERENCES payment_events(event_id),
  amount_kurus bigint NOT NULL,
  issued_at timestamptz NOT NULL
);
CREATE INDEX invoices_user_idx ON invoices (user_id, issued_at DESC);

CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  subject text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL
);
CREATE INDEX tickets_user_idx ON tickets (user_id, created_at DESC);

CREATE TABLE ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author text NOT NULL CHECK (author IN ('customer', 'staff')),
  body text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE jobs (
  id bigserial PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('create_tenant', 'freeze_tenant')),
  dedupe_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'done', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  run_after timestamptz NOT NULL,
  last_error text
);
CREATE INDEX jobs_due_idx ON jobs (status, run_after);
