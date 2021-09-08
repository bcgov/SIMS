CREATE TABLE IF NOT EXISTS coe_denied_reasons(
  id INTEGER PRIMARY KEY,
  reason VARCHAR(250) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
  SET
    NULL
);

-- Comments
COMMENT ON TABLE coe_denied_reasons IS 'COE denied reason table for the Institution User when the COE is denied';

COMMENT ON COLUMN coe_denied_reasons.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN coe_denied_reasons.reason IS 'COE denied reason that defines the reason of COE denial';

COMMENT ON COLUMN coe_denied_reasons.is_active IS 'Indicator to check active status of COE denied reason';

COMMENT ON COLUMN coe_denied_reasons.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN coe_denied_reasons.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN coe_denied_reasons.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN coe_denied_reasons.modifier IS 'Modifier of the record. Null specified the record is modified by system';