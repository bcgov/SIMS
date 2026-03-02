ALTER TABLE
  sims.student_assessments
ADD
  COLUMN form_submission_id INT REFERENCES sims.form_submissions(id);

COMMENT ON COLUMN sims.student_assessments.form_submission_id IS 'Form submission that caused the assessment.';