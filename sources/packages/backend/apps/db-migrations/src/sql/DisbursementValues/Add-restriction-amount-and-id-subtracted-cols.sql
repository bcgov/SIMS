ALTER TABLE
  sims.disbursement_values
ADD
  COLUMN restriction_amount_subtracted NUMERIC(8, 2);

COMMENT ON COLUMN sims.disbursement_values.restriction_amount_subtracted IS 'Amount that is subtracted because of a restriction.';

ALTER TABLE
  sims.disbursement_values
ADD
  COLUMN restriction_id_subtracted INT REFERENCES sims.restrictions(id);

COMMENT ON COLUMN sims.disbursement_values.restriction_id_subtracted IS 'Restriction id that was placed for the student due to which the award amount was reduced.';