ALTER TABLE
  sims.student_disability_profile_disabilities
ADD
  COLUMN impairments_before_update VARCHAR(100) [];

COMMENT ON COLUMN sims.student_disability_profile_disabilities.impairments_before_update IS 'Column created to store the impairments information before update for rollback.';