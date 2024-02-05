ALTER TABLE
  sims.student_assessments
ADD
  COLUMN related_application_assessment_id INT REFERENCES sims.student_assessments(id);

COMMENT ON COLUMN sims.student_assessments.related_application_assessment_id IS 'Assessment id of another application''s assessment in which the changes impacted this application causing it to be reassessed.';