ALTER TABLE
    sims.applications
ADD
    COLUMN pir_hash CHAR(64),
ADD
    COLUMN pir_approval_reference_id INT REFERENCES sims.applications(id),
ADD
    COLUMN pir_assessed_date TIMESTAMP WITH TIME ZONE,
ADD
    COLUMN pir_assessed_by INT REFERENCES sims.users(id);

COMMENT ON COLUMN sims.applications.pir_hash IS 'Hash of the program information request (PIR) data.';

COMMENT ON COLUMN sims.applications.pir_approval_reference_id IS 'Application that approved this PIR previously, if any.';

COMMENT ON COLUMN sims.applications.pir_assessed_date IS 'Date when the PIR was assessed (completed or denied).';

COMMENT ON COLUMN sims.applications.pir_assessed_by IS 'User who assessed the PIR.';