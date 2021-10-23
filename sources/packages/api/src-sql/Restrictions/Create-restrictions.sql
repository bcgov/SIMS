-- Create Table sims.restrictions
CREATE TABLE IF NOT EXISTS sims.restrictions(
  id SERIAL PRIMARY KEY,
  restriction_type sims.restriction_types NOT NULL, 
  restriction_code VARCHAR(10) NOT NULL,
  description VARCHAR(250),
  allowed_count INT NOT NULL DEFAULT 0,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Comments for table and column

COMMENT ON TABLE sims.restrictions IS 'Table that holds restriction details';

COMMENT ON COLUMN sims.restrictions.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.restrictions.restriction_type IS 'Restriction type enumeration';

COMMENT ON COLUMN sims.restrictions.restriction_code IS 'Resctriction code for a restriction';

COMMENT ON COLUMN sims.restrictions.allowed_count IS 'Allowed count defines the maximum number of times a given restriction can be held by any user';

COMMENT ON COLUMN sims.restrictions.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.restrictions.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.restrictions.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.restrictions.modifier IS 'Modifier of the record. Null specified the record is modified by system';
