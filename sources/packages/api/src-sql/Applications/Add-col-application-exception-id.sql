ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS application_exception_id INT REFERENCES sims.application_exceptions(id);

COMMENT ON COLUMN sims.applications.application_exception_id IS 'Possible student application exception detected after submission usually due to some uploaded document that need be reviewed.';