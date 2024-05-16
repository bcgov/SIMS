ALTER table
  sims.student_assessments
ADD
  COLUMN previous_date_changed_reported_assessment_id INT REFERENCES sims.student_assessments(id);

COMMENT ON COLUMN sims.student_assessments.previous_date_changed_reported_assessment_id IS 'Last reported assessment id corresponding to the offering date change.';