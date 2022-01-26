--Set the NOT NULL constraint on document_number.
ALTER TABLE
  sims.disbursement_schedules
ALTER COLUMN
  document_number
SET
  NOT NULL;
