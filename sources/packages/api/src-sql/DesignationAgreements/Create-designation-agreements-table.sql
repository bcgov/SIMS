CREATE TABLE IF NOT EXISTS sims.designation_agreements (
  id SERIAL PRIMARY KEY,
  institution_id INT REFERENCES sims.institutions(id) ON DELETE CASCADE NOT NULL,
  submitted_data jsonb NOT NULL,
  designation_status sims.designation_agreement_status NOT NULL,
  submitted_by INT NOT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    submitted_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_date DATE,
    end_date DATE,
    assessed_by INT REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    assessed_date TIMESTAMP WITH TIME ZONE,
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
COMMENT ON TABLE sims.designation_agreements IS 'Designation agreements submitted by the institution for Ministry approval.';

COMMENT ON COLUMN sims.designation_agreements.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.designation_agreements.institution_id IS 'Institution that submitted the designation agreement.';

COMMENT ON COLUMN sims.designation_agreements.submitted_data IS 'Dynamic data that represents the designation agreement requested by the Institution to be approved by the Ministry.';

COMMENT ON COLUMN sims.designation_agreements.designation_status IS 'Current status of the designation agreement.';

COMMENT ON COLUMN sims.designation_agreements.submitted_by IS 'Institution user that submitted the designation agreement.';

COMMENT ON COLUMN sims.designation_agreements.submitted_date IS 'Date that the designation agreement was submitted by the institution.';

COMMENT ON COLUMN sims.designation_agreements.start_date IS 'Date that the designation agreement starts to be considered active.';

COMMENT ON COLUMN sims.designation_agreements.end_date IS 'Date that the designation agreement stops to be considered active.';

COMMENT ON COLUMN sims.designation_agreements.assessed_by IS 'Ministry user that approved or declined the designation agreement.';

COMMENT ON COLUMN sims.designation_agreements.assessed_date IS 'Date that the Ministry user approved or declined the designation agreement.';

COMMENT ON COLUMN sims.designation_agreements.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.designation_agreements.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.designation_agreements.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.designation_agreements.modifier IS 'Modifier of the record. Null specified the record is modified by system.';