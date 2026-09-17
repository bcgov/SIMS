ALTER TABLE
  sims.education_programs_offerings
ADD
  COLUMN study_breaks_before_update JSONB;

COMMENT ON COLUMN sims.education_programs_offerings.study_breaks_before_update IS 'Column created to store the study breaks information before update for rollback.';

ALTER TABLE
  sims.education_programs_offerings_history
ADD
  COLUMN study_breaks_before_update JSONB;

COMMENT ON COLUMN sims.education_programs_offerings_history.study_breaks_before_update IS 'Historical data from the original table. See original table comments for details.';