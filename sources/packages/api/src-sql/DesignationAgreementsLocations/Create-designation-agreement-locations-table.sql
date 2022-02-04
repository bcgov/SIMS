CREATE TABLE IF NOT EXISTS sims.designation_agreement_locations (
  id SERIAL PRIMARY KEY,
  designation_agreement_id INT REFERENCES sims.designation_agreements(id) ON DELETE CASCADE NOT NULL,
  location_id INT REFERENCES sims.institution_locations(id) ON DELETE CASCADE NOT NULL,
  requested BOOLEAN NOT NULL,
  approved BOOLEAN NULL,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.designation_agreement_locations IS 'Designation agreements submitted by the institution for Ministry approval.';

COMMENT ON COLUMN sims.designation_agreement_locations.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.designation_agreement_locations.designation_agreement_id IS 'Designation agreement.';

COMMENT ON COLUMN sims.designation_agreement_locations.location_id IS 'Location associated with the designation agreement.';

COMMENT ON COLUMN sims.designation_agreement_locations.requested IS 'Indicates if the institution included the location in the designation agreement.';

COMMENT ON COLUMN sims.designation_agreement_locations.approved IS 'Indicates if the Ministry approved the location to be part of the designation agreement.';

COMMENT ON COLUMN sims.designation_agreement_locations.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.designation_agreement_locations.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.designation_agreement_locations.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.designation_agreement_locations.modifier IS 'Modifier of the record. Null specified the record is modified by system.';