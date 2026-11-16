CREATE TABLE IF NOT EXISTS price_ticks (
  id BIGSERIAL PRIMARY KEY,
  route_key TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  depart_date DATE NOT NULL,
  source TEXT NOT NULL,
  airline TEXT NOT NULL,
  flight_no TEXT NOT NULL,
  price_cny NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  stops INT NOT NULL DEFAULT 0,
  duration_min INT NOT NULL,
  value_score NUMERIC(6, 2),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_ticks_route_time
  ON price_ticks (route_key, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_ticks_observed
  ON price_ticks (observed_at DESC);

CREATE TABLE IF NOT EXISTS price_alerts (
  id BIGSERIAL PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  depart_date DATE,
  max_price_cny NUMERIC(12, 2) NOT NULL,
  email TEXT,
  note TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS source_health (
  source TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  region TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms INT,
  last_ok_at TIMESTAMPTZ,
  detail TEXT
);
