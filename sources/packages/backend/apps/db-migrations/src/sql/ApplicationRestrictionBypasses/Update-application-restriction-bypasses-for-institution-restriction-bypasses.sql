ALTER TABLE
  sims.application_restriction_bypasses
ADD
  COLUMN institution_restriction_id INT REFERENCES sims.institution_restrictions(id);

ALTER TABLE
  sims.application_restriction_bypasses
ALTER COLUMN
  student_restriction_id DROP NOT NULL;

COMMENT ON COLUMN sims.application_restriction_bypasses.institution_restriction_id IS 'Reference to the institution restriction that will have the bypass applied.';