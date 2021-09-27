CREATE TABLE IF NOT EXISTS sims.cra_income_verifications (
  id SERIAL PRIMARY KEY,
  tax_year SMALLINT NOT NULL,
  reported_income INT NOT NULL,
  cra_reported_income INT,
  date_sent TIMESTAMP WITH TIME ZONE,
  date_received TIMESTAMP WITH TIME ZONE,
  file_sent VARCHAR(50),
  file_received VARCHAR(50),
  match_status VARCHAR(50),
  request_status VARCHAR(50),
  -- Reference Columns
  application_Id INT REFERENCES sims.applications(id) ON DELETE CASCADE,
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.cra_income_verifications IS 'Income verifications that must be performed with CRA.';

COMMENT ON COLUMN sims.cra_income_verifications.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.cra_income_verifications.tax_year IS 'Tax year to perform the income verification.';

COMMENT ON COLUMN sims.cra_income_verifications.reported_income IS 'User reported income (e.g. reported on Student Application).';

COMMENT ON COLUMN sims.cra_income_verifications.cra_reported_income IS 'Total income value retrieved from CRA file (currently line 15000 form tax file).';

COMMENT ON COLUMN sims.cra_income_verifications.date_sent IS 'Date and time that the income request file was generated and sent to CRA for verification.';

COMMENT ON COLUMN sims.cra_income_verifications.date_received IS 'Date and time that the CRA sent a response for an income verification.';

COMMENT ON COLUMN sims.cra_income_verifications.file_sent IS 'Name of the file sent to CRA to request a income verification.';

COMMENT ON COLUMN sims.cra_income_verifications.file_received IS 'Name of the file received from CRA with the response for an income verification.';

COMMENT ON COLUMN sims.cra_income_verifications.match_status IS 'Match status code returned from CRA (e.g. 01 - SUCCESSFUL-MATCH).';

COMMENT ON COLUMN sims.cra_income_verifications.request_status IS 'Request status code returned from CRA (e.g. 01 - SUCCESSFUL-REQUEST).';

COMMENT ON COLUMN sims.cra_income_verifications.application_Id IS 'Student Application id that requires the income verification.';

COMMENT ON COLUMN sims.cra_income_verifications.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.cra_income_verifications.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.cra_income_verifications.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.cra_income_verifications.modifier IS 'Modifier of the record. Null specified the record is modified by system';