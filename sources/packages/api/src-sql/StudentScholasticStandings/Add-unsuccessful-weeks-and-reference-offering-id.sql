-- Add unsuccessful_weeks column for sims.student_scholastic_standings.
ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN IF NOT EXISTS unsuccessful_weeks SMALLINT;

COMMENT ON COLUMN sims.student_scholastic_standings.unsuccessful_weeks IS 'The number of unsuccessful weeks for a fulltime application that have a scholastic standing. If the sum of fulltime unsuccessful weeks hits 68, then SSR restriction is added for that student.';

-- Add reference_offering_id column for sims.student_scholastic_standings.
-- Reference Column.
ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN IF NOT EXISTS reference_offering_id INT REFERENCES sims.education_programs_offerings(id) ON DELETE
SET
  NULL;

COMMENT ON COLUMN sims.student_scholastic_standings.reference_offering_id IS 'The offering id for the application at the time of scholastic standing submission. Once the scholastic standing is submitted, if there is a reassessment then the current offering id will be different.';