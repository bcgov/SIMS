ALTER TABLE
  sims.application_restriction_bypasses DROP CONSTRAINT IF EXISTS exactly_one_restriction_reference;

ALTER TABLE
  sims.application_restriction_bypasses DROP COLUMN institution_restriction_id;

ALTER TABLE
  sims.application_restriction_bypasses
ALTER COLUMN
  student_restriction_id
SET
  NOT NULL;