ALTER table
  sims.student_assessments
ADD
  COLUMN previous_date_changed_reported_assessment_id INT REFERENCES sims.student_assessments(id);

COMMENT ON COLUMN sims.student_assessments.previous_date_changed_reported_assessment_id IS 'Previously reported assessment for the application.';

ALTER TABLE
  sims.student_assessments
ADD
  COLUMN reported_date TIMESTAMPTZ;

COMMENT ON COLUMN sims.student_assessments.reported_date IS 'Date on which the assessment causing the study date change has been reported.';