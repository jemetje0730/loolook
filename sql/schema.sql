CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS toilets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  address TEXT,
  source TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  male BOOLEAN,
  female BOOLEAN,
  unisex BOOLEAN,
  babycare BOOLEAN,
  accessible BOOLEAN,
  opening_hours TEXT,
  phone TEXT,
  geom GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS toilets_geom_idx ON toilets USING GIST (geom);
CREATE INDEX IF NOT EXISTS toilets_public_idx ON toilets (is_public);
