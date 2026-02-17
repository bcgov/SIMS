ALTER TABLE
  sims.application_restriction_bypasses DROP CONSTRAINT student_institution_restriction_id_constraint;

ALTER TABLE
  sims.application_restriction_bypasses DROP COLUMN institution_restriction_id;

ALTER TABLE
  sims.application_restriction_bypasses
ALTER COLUMN
  student_restriction_id
SET
  NOT NULL;