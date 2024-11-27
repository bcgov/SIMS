ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN has_estimated_awards BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN sims.disbursement_schedules.has_estimated_awards IS 'Indication for whether the disbursement has estimated awards against the $0 total disbursement value.';