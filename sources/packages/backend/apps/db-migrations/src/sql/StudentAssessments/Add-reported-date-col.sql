ALTER TABLE
  sims.student_assessments
ADD
  COLUMN reported_date TIMESTAMPTZ;

COMMENT ON COLUMN sims.student_assessments.reported_date IS 'Timestamp for the last reported assessment id.';