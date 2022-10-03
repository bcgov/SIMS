CREATE TABLE IF NOT EXISTS pir_denied_reason(
  id INTEGER PRIMARY KEY,
  reason VARCHAR(250) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE pir_denied_reason IS 'PIR denied reason table for the Institution User when the PIR is denied';

COMMENT ON COLUMN pir_denied_reason.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN pir_denied_reason.reason IS 'PIR denied reason that defines the reason of PIR denial';

COMMENT ON COLUMN pir_denied_reason.is_active IS 'Indicator to check active status of PIR denied reason';

COMMENT ON COLUMN pir_denied_reason.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN pir_denied_reason.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN pir_denied_reason.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN pir_denied_reason.modifier IS 'Modifier of the record. Null specified the record is modified by system';