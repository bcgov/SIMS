CREATE TABLE sims.sfas_restriction_maps (
  id SERIAL PRIMARY KEY,
  legacy_code VARCHAR(4) NOT NULL,
  code VARCHAR(10) NOT NULL,
  is_legacy_only BOOLEAN NOT NULL,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (legacy_code, code)
);

-- ## Comments
COMMENT ON TABLE sims.sfas_restriction_maps IS 'Restriction maps between legacy codes and SIMS codes.';

COMMENT ON COLUMN sims.sfas_restriction_maps.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.sfas_restriction_maps.legacy_code IS 'SFAS restriction code.';

COMMENT ON COLUMN sims.sfas_restriction_maps.code IS 'SIMS restriction code.';

COMMENT ON COLUMN sims.sfas_restriction_maps.is_legacy_only IS 'Indicates if the code is a legacy code, which has no direct mapping to SIMS, and a SIMS restriction must be created if not present. This restriction should not be managed by SIMS, it can only transition to resolved.';

-- Audit columns
COMMENT ON COLUMN sims.sfas_restriction_maps.created_at IS 'Record creation timestamp.';

-- Add current legacy map.
INSERT INTO
  sims.sfas_restriction_maps (legacy_code, code, is_legacy_only)
VALUES
  ('A12', '12', false),
  ('AF1', 'AF', false),
  ('B2D', 'B2', false)