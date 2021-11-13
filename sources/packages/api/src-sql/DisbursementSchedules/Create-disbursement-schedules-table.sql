CREATE TABLE IF NOT EXISTS sims.disbursement_schedules(
  id SERIAL PRIMARY KEY,
  document_number INT NOT NULL,
  disbursement_date DATE NOT NULL,
  -- Reference Columns
  application_id INT NOT NULL REFERENCES sims.applications(id) ON DELETE
  SET
    NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.disbursement_schedules IS 'Disbursement schedules for a Student Application.';

COMMENT ON COLUMN sims.disbursement_schedules.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.disbursement_schedules.document_number IS 'Financial document number associated with this disbursement.';

COMMENT ON COLUMN sims.disbursement_schedules.disbursement_date IS 'Date that the money must be disbursed.';

COMMENT ON COLUMN sims.disbursement_schedules.application_id IS 'Student Application related to the discursement.';

COMMENT ON COLUMN sims.disbursement_schedules.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.disbursement_schedules.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.disbursement_schedules.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.disbursement_schedules.modifier IS 'Modifier of the record. Null specified the record is modified by system';