ALTER TABLE
  sims.disbursement_receipts
ADD
  COLUMN file_date DATE NOT NULL;

COMMENT ON COLUMN sims.disbursement_receipts.total_entitled_grant_amount IS 'This reflects the date when the NSLSC file was produced.';

ALTER TABLE
  sims.disbursement_receipts
ADD
  COLUMN sequence_number NUMERIC(5) NOT NULL;

COMMENT ON COLUMN sims.disbursement_receipts.total_entitled_grant_amount IS 'This reflects the sequence number as produced by NSLSC report.';