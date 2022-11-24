CREATE TABLE IF NOT EXISTS sims.disbursement_overawards(
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES sims.students(id),
  disbursement_schedule_id INT REFERENCES sims.disbursement_schedules(id),
  overaward_value NUMERIC(8, 2) NOT NULL,
  disbursement_value_code VARCHAR(10) NOT NULL,
  origin_type sims.disbursement_overaward_origin_types NOT NULL,
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
COMMENT ON TABLE sims.disbursement_overawards IS 'Students overawards resulted from reassessments calculations.';

COMMENT ON COLUMN sims.disbursement_overawards.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.disbursement_overawards.student_id IS 'Student related to the overaward.';

COMMENT ON COLUMN sims.disbursement_overawards.disbursement_schedule_id IS 'Related disbursement schedule. When not present, it represents a manual entry.';

COMMENT ON COLUMN sims.disbursement_overawards.overaward_value IS 'Overaward value (a positive value indicates the amount the student owes).';

COMMENT ON COLUMN sims.disbursement_overawards.disbursement_value_code IS 'Value code related to the overaward_value, for instance, CSLF, CSPT, BCSL.';

COMMENT ON COLUMN sims.disbursement_overawards.origin_type IS 'Origin of the record.';

COMMENT ON COLUMN sims.disbursement_overawards.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.disbursement_overawards.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.disbursement_overawards.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.disbursement_overawards.modifier IS 'Modifier of the record.';