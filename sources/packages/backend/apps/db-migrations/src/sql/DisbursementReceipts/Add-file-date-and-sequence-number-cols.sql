ALTER TABLE
  sims.disbursement_receipts
ADD
  COLUMN file_date DATE NULL;

COMMENT ON COLUMN sims.disbursement_receipts.total_entitled_grant_amount IS 'This reflects the date when the NSLSC file was produced.';

ALTER TABLE
  sims.disbursement_receipts
ADD
  COLUMN sequence_number INTEGER NULL;

COMMENT ON COLUMN sims.disbursement_receipts.total_entitled_grant_amount IS 'This reflects the sequence number as produced by NSLSC report.';

-- Updates the existing records with dummy values.
UPDATE
  sims.disbursement_receipts
SET
  file_date = CURRENT_DATE;

-- Updates the existing records with dummy values.
UPDATE
  sims.disbursement_receipts
SET
  sequence_number = 0;

ALTER TABLE
  sims.disbursement_receipts
ALTER COLUMN
  sequence_number
SET
  NOT NULL;

ALTER TABLE
  sims.disbursement_receipts
ALTER COLUMN
  file_date
SET
  NOT NULL;