-- ## Create disbursement_feedback_errors
CREATE TABLE IF NOT EXISTS sims.disbursement_feedback_errors(
  id SERIAL PRIMARY KEY,
  date_received TIMESTAMP WITH TIME ZONE NOT NULL,
  error_code VARCHAR(10) NOT NULL,
  -- Reference Columns
  disbursement_schedule_id INT NOT NULL REFERENCES sims.disbursement_schedules(id) ON DELETE CASCADE,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    CONSTRAINT disbursement_schedule_id_error_code_unique UNIQUE (disbursement_schedule_id, error_code)
);

-- ## Comments
COMMENT ON TABLE sims.disbursement_feedback_errors IS 'Disbursements Feeback Errors for a Student Application.';

COMMENT ON COLUMN sims.disbursement_feedback_errors.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.disbursement_feedback_errors.date_received IS 'Feedback errors recevied timestamp in UTC.';

COMMENT ON COLUMN sims.disbursement_feedback_errors.error_code IS 'Errors code received from feedback file for the disbursement sent to ESDC.';

COMMENT ON COLUMN sims.disbursement_feedback_errors.disbursement_schedule_id IS 'Related disbursement schedule.';

COMMENT ON COLUMN sims.disbursement_feedback_errors.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.disbursement_feedback_errors.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.disbursement_feedback_errors.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.disbursement_feedback_errors.modifier IS 'Modifier of the record. Null specified the record is modified by system';