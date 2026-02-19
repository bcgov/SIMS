ALTER TABLE
  sims.application_restriction_bypasses
ADD
  COLUMN institution_restriction_id INT REFERENCES sims.institution_restrictions(id);

ALTER TABLE
  sims.application_restriction_bypasses
ALTER COLUMN
  student_restriction_id DROP NOT NULL;

COMMENT ON COLUMN sims.application_restriction_bypasses.institution_restriction_id IS 'Active institution restriction to be bypassed.';

-- Ensure exactly one of student_restriction_id or institution_restriction_id is populated.
ALTER TABLE
  sims.application_restriction_bypasses
ADD
  CONSTRAINT student_institution_restriction_id_constraint CHECK (
    (
      student_restriction_id IS NOT NULL
      AND institution_restriction_id IS NULL
    )
    OR (
      student_restriction_id IS NULL
      AND institution_restriction_id IS NOT NULL
    )
  );

COMMENT ON CONSTRAINT student_institution_restriction_id_constraint ON sims.application_restriction_bypasses IS 'Constraint to assign either the student restriction or the institution restriction, but not both.';